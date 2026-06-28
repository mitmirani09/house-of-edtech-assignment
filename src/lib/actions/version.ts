'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Create a snapshot using the current editor HTML content
export async function createVersionSnapshot(documentId: string, label: string | null, htmlContent: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated' }
  }

  try {
    // 1. Verify user membership and role (OWNER or EDITOR)
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId,
        },
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      return { error: 'Unauthorized. You need edit permissions to create snapshots.' }
    }

    // 2. Create the version snapshot record with the HTML content
    // yState is kept as a minimal stub since we use htmlContent for reliable display
    const snapshot = await prisma.versionSnapshot.create({
      data: {
        documentId,
        createdBy: session.user.id,
        label: label?.trim() || null,
        yState: Buffer.from(''),  // minimal stub, not used
        htmlContent: htmlContent,
      } as any,
    })

    revalidatePath(`/documents/${documentId}`)
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

  try {
    // Verify membership
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId,
        },
      },
    })

    if (!membership) {
      return { error: 'Access denied.' }
    }

    const snapshots = await prisma.versionSnapshot.findMany({
      where: { documentId },
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

  try {
    // 1. Verify caller has OWNER or EDITOR role
    const membership = await prisma.documentMember.findUnique({
      where: {
        userId_documentId: {
          userId: session.user.id,
          documentId,
        },
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      return { error: 'Unauthorized. You need edit permissions to restore snapshots.' }
    }

    // 2. Fetch the snapshot html
    const snapshot = await prisma.versionSnapshot.findUnique({
      where: { id: snapshotId },
      select: { htmlContent: true } as any,
    })

    if (!snapshot) {
      return { error: 'Snapshot not found' }
    }

    // 3. Update the document content column with restored HTML
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: (snapshot as any).htmlContent || '',
        // Also clear the yState so the WS server loads fresh from html on restart
        yState: null,
      },
    })

    revalidatePath(`/documents/${documentId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to restore version snapshot:', error)
    return { error: 'Failed to restore version' }
  }
}
