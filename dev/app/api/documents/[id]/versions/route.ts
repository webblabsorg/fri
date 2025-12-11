import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, validateFile } from '@/lib/storage/storage-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id]/versions
 * List all versions of a document
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

    const versions = await prisma.projectDocumentVersion.findMany({
      where: { documentId },
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
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('[API] Get versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[id]/versions
 * Create a new version by uploading a new file
 */
export async function POST(
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
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const changelog = formData.get('changelog') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
          'text/markdown',
        ],
      }
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload new version to storage
    const uploadResult = await uploadFile({
      file: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      contentType: file.type,
      metadata: {
        projectId: document.projectId,
        workspaceId: document.workspaceId || undefined,
        organizationId: document.organizationId || undefined,
        userId: user.id,
        documentId,
      },
    });

    // Calculate next version number
    const latestVersion = document.versions[0];
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create new version
    const version = await prisma.projectDocumentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersionNumber,
        storageKey: uploadResult.storageKey,
        mimeType: file.type,
        sizeBytes: uploadResult.size,
        changelog: changelog || `Version ${nextVersionNumber}`,
        createdById: user.id,
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

    // Update document to point to the latest version
    await prisma.projectDocument.update({
      where: { id: documentId },
      data: {
        storageKey: uploadResult.storageKey,
        mimeType: file.type,
        sizeBytes: uploadResult.size,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        workspaceId: document.project.workspaceId,
        action: 'updated',
        targetType: 'document',
        targetId: documentId,
        description: `Uploaded version ${nextVersionNumber} of document "${document.name}"`,
        metadata: {
          projectId: document.projectId,
          documentName: document.name,
          versionNumber: nextVersionNumber,
          changelog: version.changelog,
        },
      },
    });

    return NextResponse.json({
      version,
      message: 'New version created successfully',
    });
  } catch (error) {
    console.error('[API] Create version error:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
