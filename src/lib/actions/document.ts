'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'

export async function createDocument(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  if (!title || title.trim() === '') {
    return { error: 'Title is required' }
  }

  try {
    const doc = await prisma.document.create({
      data: {
        title: title.trim(),
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

  const documentId = formData.get('documentId') as string
  if (!documentId || documentId.trim() === '') {
    return { error: 'Document ID is required' }
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId.trim() },
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

  try {
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId,
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

  try {
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId,
        },
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      return { error: 'Unauthorized. You do not have write access to this document.' }
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { content },
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

  // 1. Verify caller is OWNER
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId,
      },
    },
  })

  if (!callerMember || callerMember.role !== Role.OWNER) {
    return { error: 'Unauthorized. Only the owner can invite collaborators.' }
  }

  const normalizedEmail = email.trim().toLowerCase()

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
        documentId,
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
        documentId,
        role,
      },
    })

    revalidatePath(`/documents/${documentId}`)
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

  // Verify caller is a member
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId,
      },
    },
  })

  if (!callerMember) {
    return { error: 'Access denied.' }
  }

  try {
    const members = await prisma.documentMember.findMany({
      where: { documentId },
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

  // Verify caller is OWNER
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId,
      },
    },
  })

  if (!callerMember || callerMember.role !== Role.OWNER) {
    return { error: 'Unauthorized. Only the owner can change collaborator roles.' }
  }

  if (newRole === Role.OWNER) {
    return { error: 'Cannot transfer ownership via this action.' }
  }

  try {
    const targetMember = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: memberUserId,
          documentId,
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
          userId: memberUserId,
          documentId,
        },
      },
      data: {
        role: newRole,
      },
    })

    revalidatePath(`/documents/${documentId}`)
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

  // Verify caller is OWNER
  const callerMember = await prisma.documentMember.findUnique({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId,
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
          userId: memberUserId,
          documentId,
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
          userId: memberUserId,
          documentId,
        },
      },
    })

    revalidatePath(`/documents/${documentId}`)
    return { success: true }
  } catch (error) {
    console.error('Remove member error:', error)
    return { error: 'Failed to remove collaborator.' }
  }
}
