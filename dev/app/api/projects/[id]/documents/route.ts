import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, validateFile } from '@/lib/storage/storage-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/documents
 * List all documents for a project
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

    const { id: projectId } = await context.params;

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access: either creator, or member of workspace
    const hasAccess =
      project.createdBy === user.id ||
      (project.workspace && project.workspace.members.length > 0);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch documents with versions count
    const documents = await prisma.projectDocument.findMany({
      where: { projectId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('[API] Get project documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/documents
 * Upload a new document to a project
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

    const { id: projectId } = await context.params;

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check write access: either creator, or workspace member with appropriate role
    const hasWriteAccess =
      project.createdBy === user.id ||
      (project.workspace && project.workspace.members.some(m => m.role !== 'viewer'));

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

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

    // Upload file to storage
    const uploadResult = await uploadFile({
      file: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      contentType: file.type,
      metadata: {
        projectId,
        workspaceId: project.workspaceId || undefined,
        organizationId: project.organizationId || undefined,
        userId: user.id,
      },
    });

    // Create document record in database
    const document = await prisma.projectDocument.create({
      data: {
        projectId,
        workspaceId: project.workspaceId,
        organizationId: project.organizationId,
        name: name || file.name,
        description,
        originalFileName: file.name,
        storageKey: uploadResult.storageKey,
        mimeType: file.type,
        sizeBytes: uploadResult.size,
        status: 'uploaded',
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

    // Create initial version
    await prisma.projectDocumentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        storageKey: uploadResult.storageKey,
        mimeType: file.type,
        sizeBytes: uploadResult.size,
        changelog: 'Initial version',
        createdById: user.id,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        workspaceId: project.workspaceId,
        action: 'created',
        targetType: 'document',
        targetId: document.id,
        description: `Uploaded document "${document.name}" to project "${project.name}"`,
        metadata: {
          projectId,
          documentName: document.name,
          fileSize: document.sizeBytes,
        },
      },
    });

    return NextResponse.json({
      document,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('[API] Upload document error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
