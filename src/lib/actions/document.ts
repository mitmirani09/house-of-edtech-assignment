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
