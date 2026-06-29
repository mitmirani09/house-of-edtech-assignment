'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { rateLimit } from '@/lib/rateLimit'
import { sanitizeHtml } from '@/lib/sanitize'

// Zod schemas for validation
const CreateSnapshotSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
  label: z.string().max(50, 'Label cannot exceed 50 characters').nullable(),
  htmlContent: z.string().max(2 * 1024 * 1024, 'Snapshot payload cannot exceed 2MB'),
})

const GetSnapshotsSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
})

const RestoreSnapshotSchema = z.object({
  documentId: z.string().cuid('Invalid Document ID'),
  snapshotId: z.string().cuid('Invalid Snapshot ID'),
})

// Create a snapshot using the current editor HTML content
export async function createVersionSnapshot(documentId: string, label: string | null, htmlContent: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`create-snapshot:${session.user.id}`, 10, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const validation = CreateSnapshotSchema.safeParse({ documentId, label, htmlContent })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const sanitizedHtml = sanitizeHtml(validation.data.htmlContent)

  try {
    // 1. Verify user membership and role (OWNER or EDITOR)
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId: validation.data.documentId,
        },
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      return { error: 'Unauthorized. You need edit permissions to create snapshots.' }
    }

    // 2. Create the version snapshot record with the HTML content
    const snapshot = await prisma.versionSnapshot.create({
      data: {
        documentId: validation.data.documentId,
        createdBy: session.user.id,
        label: validation.data.label ? validation.data.label.trim() : null,
        yState: Buffer.from(''),  // minimal stub, not used
        htmlContent: sanitizedHtml,
      } as any,
    })

    revalidatePath(`/documents/${validation.data.documentId}`)
    return { success: true, snapshotId: snapshot.id }
  } catch (error) {
    console.error('Failed to create version snapshot:', error)
    return { error: 'Failed to save version snapshot' }
  }
}

export async function getVersionSnapshots(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  const validation = GetSnapshotsSchema.safeParse({ documentId })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    // Verify membership
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId: validation.data.documentId,
        },
      },
    })

    if (!membership) {
      return { error: 'Access denied.' }
    }

    const snapshots = await prisma.versionSnapshot.findMany({
      where: { documentId: validation.data.documentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedSnapshots = snapshots.map((s: any) => ({
      id: s.id,
      label: s.label,
      createdAt: s.createdAt.toISOString(),
      createdByName: s.user.name || s.user.email || 'Anonymous',
      htmlContent: s.htmlContent || '',
    }))

    return { success: true, snapshots: formattedSnapshots }
  } catch (error) {
    console.error('Failed to get version snapshots:', error)
    return { error: 'Failed to load version history' }
  }
}

export async function restoreVersionSnapshot(documentId: string, snapshotId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  // Rate Limiting
  const limitRes = rateLimit(`restore-snapshot:${session.user.id}`, 10, 60000)
  if (!limitRes.success) {
    return { error: limitRes.error }
  }

  const validation = RestoreSnapshotSchema.safeParse({ documentId, snapshotId })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    // 1. Verify caller has OWNER or EDITOR role
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId: validation.data.documentId,
        },
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      return { error: 'Unauthorized. You need edit permissions to restore snapshots.' }
    }

    // 2. Fetch the snapshot html
    const snapshot = await prisma.versionSnapshot.findUnique({
      where: { id: validation.data.snapshotId },
      select: { htmlContent: true } as any,
    })

    if (!snapshot) {
      return { error: 'Snapshot not found' }
    }

    // 3. Update the document content column with restored HTML
    await prisma.document.update({
      where: { id: validation.data.documentId },
      data: {
        content: (snapshot as any).htmlContent || '',
        // Also clear the yState so the WS server loads fresh from html on restart
        yState: null,
      },
    })

    revalidatePath(`/documents/${validation.data.documentId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to restore version snapshot:', error)
    return { error: 'Failed to restore version' }
  }
}
