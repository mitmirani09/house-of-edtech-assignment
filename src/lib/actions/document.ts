'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { rateLimit } from '@/lib/rateLimit'
import { sanitizeHtml } from '@/lib/sanitize'

// Zod schemas for validation
const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
})

const JoinDocumentSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
})

const UpdateContentSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
  content: z.string().max(2 * 1024 * 1024, 'Document payload cannot exceed 2MB'),
})

const InviteUserSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(Role),
})

const UpdateMemberRoleSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
  memberUserId: z.string().cuid('Invalid User ID'),
  newRole: z.nativeEnum(Role),
})

const RemoveMemberSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
  memberUserId: z.string().cuid('Invalid User ID'),
})

export async function createDocument(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`create-doc:${session.user.id}`, 10, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const title = formData.get('title') as string
  const validation = CreateDocumentSchema.safeParse({ title })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    const doc = await prisma.document.create({
      data: {
        title: validation.data.title.trim(),
        members: {
          create: {
            userId: session.user.id,
            role: Role.OWNER,
          },
        },
      },
    })

    revalidatePath('/dashboard')
    return { success: true, docId: doc.id }
  } catch (error) {
    console.error('Create document error:', error)
    return { error: 'Failed to create document' }
  }
}

export async function joinDocument(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`join-doc:${session.user.id}`, 15, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const documentId = formData.get('documentId') as string
  const validation = JoinDocumentSchema.safeParse({ documentId })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: validation.data.documentId },
    })

    if (!doc) {
      return { error: 'Document not found' }
    }

    // Check if user is already a member
    const existingMembership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId: doc.id,
        },
      },
    })

    if (existingMembership) {
      return { success: true, docId: doc.id, message: 'Already a member' }
    }

    // Join as VIEWER by default
    await prisma.documentMember.create({
      data: {
        userId: session.user.id,
        documentId: doc.id,
        role: Role.VIEWER,
      },
    })

    revalidatePath('/dashboard')
    return { success: true, docId: doc.id }
  } catch (error) {
    console.error('Join document error:', error)
    return { error: 'Failed to join document' }
  }
}

export async function getDocumentWithRole(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  const validation = JoinDocumentSchema.safeParse({ documentId })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId: validation.data.documentId,
        },
      },
      include: {
        document: true,
      },
    })

    if (!membership) {
      return { error: 'Access denied. You are not a member of this document.' }
    }

    return {
      success: true,
      document: membership.document,
      role: membership.role,
    }
  } catch (error) {
    console.error('Get document with role error:', error)
    return { error: 'Failed to load document' }
  }
}

export async function updateDocumentContent(documentId: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`save:${session.user.id}`, 120, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const validation = UpdateContentSchema.safeParse({ documentId, content })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Sanitize the HTML payload to prevent XSS
  const sanitizedContent = sanitizeHtml(validation.data.content)

  try {
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId: validation.data.documentId,
        },
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      return { error: 'Unauthorized. You do not have write access to this document.' }
    }

    await prisma.document.update({
      where: { id: validation.data.documentId },
      data: { content: sanitizedContent },
    })

    return { success: true }
  } catch (error) {
    console.error('Update document content error:', error)
    return { error: 'Failed to save changes' }
  }
}

export async function inviteUserToDocument(documentId: string, email: string, role: Role) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`invite:${session.user.id}`, 15, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const validation = InviteUserSchema.safeParse({ documentId, email, role })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const normalizedEmail = validation.data.email.trim().toLowerCase()

  // 1. Verify caller is OWNER
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId: validation.data.documentId,
      },
    },
  })

  if (!callerMember || callerMember.role !== Role.OWNER) {
    return { error: 'Unauthorized. Only the owner can invite collaborators.' }
  }

  // 2. Look up target user by email
  const targetUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!targetUser) {
    return { error: 'User with this email does not exist.' }
  }

  // 3. Verify target is not already a member
  const existingMembership = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: targetUser.id,
        documentId: validation.data.documentId,
      },
    },
  })

  if (existingMembership) {
    return { error: 'User is already a collaborator on this document.' }
  }

  try {
    await prisma.documentMember.create({
      data: {
        userId: targetUser.id,
        documentId: validation.data.documentId,
        role: validation.data.role,
      },
    })

    revalidatePath(`/documents/${validation.data.documentId}`)
    return { success: true }
  } catch (error) {
    console.error('Invite user error:', error)
    return { error: 'Failed to invite user.' }
  }
}

export async function getDocumentMembers(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  const validation = JoinDocumentSchema.safeParse({ documentId })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Verify caller is a member
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId: validation.data.documentId,
      },
    },
  })

  if (!callerMember) {
    return { error: 'Access denied.' }
  }

  try {
    const members = await prisma.documentMember.findMany({
      where: { documentId: validation.data.documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        role: 'asc', // OWNER, then EDITOR, then VIEWER
      },
    })

    return { success: true, members }
  } catch (error) {
    console.error('Get document members error:', error)
    return { error: 'Failed to load collaborators.' }
  }
}

export async function updateMemberRole(documentId: string, memberUserId: string, newRole: Role) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`member-role:${session.user.id}`, 20, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const validation = UpdateMemberRoleSchema.safeParse({ documentId, memberUserId, newRole })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  if (validation.data.newRole === Role.OWNER) {
    return { error: 'Cannot transfer ownership via this action.' }
  }

  // Verify caller is OWNER
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId: validation.data.documentId,
      },
    },
  })

  if (!callerMember || callerMember.role !== Role.OWNER) {
    return { error: 'Unauthorized. Only the owner can change collaborator roles.' }
  }

  try {
    const targetMember = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: validation.data.memberUserId,
          documentId: validation.data.documentId,
        },
      },
    })

    if (!targetMember) {
      return { error: 'Collaborator not found.' }
    }

    if (targetMember.role === Role.OWNER) {
      return { error: 'Cannot modify ownership role.' }
    }

    await prisma.documentMember.update({
      where: {
        userId_documentId: {
          userId: validation.data.memberUserId,
          documentId: validation.data.documentId,
        },
      },
      data: {
        role: validation.data.newRole,
      },
    })

    revalidatePath(`/documents/${validation.data.documentId}`)
    return { success: true }
  } catch (error) {
    console.error('Update member role error:', error)
    return { error: 'Failed to update access role.' }
  }
}

export async function removeMember(documentId: string, memberUserId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`remove-member:${session.user.id}`, 20, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const validation = RemoveMemberSchema.safeParse({ documentId, memberUserId })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Verify caller is OWNER
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId: validation.data.documentId,
      },
    },
  })

  if (!callerMember || callerMember.role !== Role.OWNER) {
    return { error: 'Unauthorized. Only the owner can remove collaborators.' }
  }

  try {
    const targetMember = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: validation.data.memberUserId,
          documentId: validation.data.documentId,
        },
      },
    })

    if (!targetMember) {
      return { error: 'Collaborator not found.' }
    }

    if (targetMember.role === Role.OWNER) {
      return { error: 'Cannot remove the owner of the document.' }
    }

    await prisma.documentMember.delete({
      where: {
        userId_documentId: {
          userId: validation.data.memberUserId,
          documentId: validation.data.documentId,
        },
      },
    })

    revalidatePath(`/documents/${validation.data.documentId}`)
    return { success: true }
  } catch (error) {
    console.error('Remove member error:', error)
    return { error: 'Failed to remove collaborator.' }
  }
}
