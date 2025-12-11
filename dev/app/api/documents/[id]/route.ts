import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/storage/storage-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id]
 * Get document details with versions
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSessionUser(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await context.params;

    const document = await prisma.projectDocument.findUnique({
      where: { id: documentId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access
    const hasAccess =
      document.project.createdBy === user.id ||
      (document.project.workspace && document.project.workspace.members.length > 0);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('[API] Get document error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document and all its versions
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSessionUser(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await context.params;

    const document = await prisma.projectDocument.findUnique({
      where: { id: documentId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
        versions: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check write access
    const hasWriteAccess =
      document.project.createdBy === user.id ||
      (document.project.workspace && document.project.workspace.members.some(m => m.role !== 'viewer'));

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete files from storage
    try {
      await deleteFile(document.storageKey);
      
      // Delete all version files
      for (const version of document.versions) {
        if (version.storageKey !== document.storageKey) {
          await deleteFile(version.storageKey);
        }
      }
    } catch (error) {
      console.error('[API] Error deleting files from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document (cascade will delete versions)
    await prisma.projectDocument.delete({
      where: { id: documentId },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        workspaceId: document.project.workspaceId,
        action: 'deleted',
        targetType: 'document',
        targetId: documentId,
        description: `Deleted document "${document.name}" from project "${document.project.name}"`,
        metadata: {
          projectId: document.projectId,
          documentName: document.name,
        },
      },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('[API] Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[id]
 * Update document metadata
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSessionUser(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await context.params;
    const body = await request.json();
    const { name, description } = body;

    const document = await prisma.projectDocument.findUnique({
      where: { id: documentId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check write access
    const hasWriteAccess =
      document.project.createdBy === user.id ||
      (document.project.workspace && document.project.workspace.members.some(m => m.role !== 'viewer'));

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedDocument = await prisma.projectDocument.update({
      where: { id: documentId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      document: updatedDocument,
      message: 'Document updated successfully',
    });
  } catch (error) {
    console.error('[API] Update document error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
