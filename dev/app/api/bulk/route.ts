import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, validateFile } from '@/lib/storage/storage-service'

/**
 * GET /api/bulk
 * List bulk jobs for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const organizationId = searchParams.get('organizationId')

    const bulkJobs = await prisma.bulkJob.findMany({
      where: {
        createdById: user.id,
        ...(workspaceId && { workspaceId }),
        ...(organizationId && { organizationId }),
      },
      include: {
        files: {
          select: {
            id: true,
            fileName: true,
            status: true,
            errorMsg: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bulkJobs })
  } catch (error) {
    console.error('[API] Get bulk jobs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bulk jobs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bulk
 * Create a new bulk processing job
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const zipFile = formData.get('zipFile') as File | null
    const name = formData.get('name') as string
    const toolId = formData.get('toolId') as string
    const config = formData.get('config') as string
    const workspaceId = formData.get('workspaceId') as string | null
    const organizationId = formData.get('organizationId') as string | null

    if (!zipFile || !name || !toolId) {
      return NextResponse.json(
        { error: 'ZIP file, name, and tool ID are required' },
        { status: 400 }
      )
    }

    // Validate ZIP file
    const validation = validateFile(
      {
        name: zipFile.name,
        size: zipFile.size,
        type: zipFile.type,
      },
      {
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: ['application/zip', 'application/x-zip-compressed'],
      }
    )

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload ZIP file to storage
    const uploadResult = await uploadFile({
      file: Buffer.from(await zipFile.arrayBuffer()),
      fileName: zipFile.name,
      contentType: zipFile.type,
      metadata: {
        workspaceId: workspaceId || undefined,
        organizationId: organizationId || undefined,
        userId: user.id,
        type: 'bulk_input',
      },
    })

    // Parse config
    let parsedConfig = {}
    try {
      parsedConfig = config ? JSON.parse(config) : {}
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid config JSON' },
        { status: 400 }
      )
    }

    // Extract ZIP to count files (mock implementation)
    const totalFiles = await countFilesInZip(zipFile)

    // Create bulk job
    const bulkJob = await prisma.bulkJob.create({
      data: {
        name,
        toolId,
        config: parsedConfig,
        status: 'pending',
        inputZipKey: uploadResult.storageKey,
        totalFiles,
        createdById: user.id,
        workspaceId,
        organizationId,
      },
      include: {
        files: true,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        workspaceId,
        action: 'created',
        targetType: 'bulk_job',
        targetId: bulkJob.id,
        description: `Created bulk processing job "${name}"`,
        metadata: {
          jobName: name,
          toolId,
          totalFiles,
          zipSize: zipFile.size,
        },
      },
    })

    // Queue the job for processing (in a real implementation, this would use a job queue)
    // For now, we'll just mark it as pending and let a worker pick it up
    console.log(`[Bulk] Created job ${bulkJob.id} with ${totalFiles} files`)

    return NextResponse.json({
      bulkJob,
      message: 'Bulk job created successfully',
    })
  } catch (error) {
    console.error('[API] Create bulk job error:', error)
    return NextResponse.json(
      { error: 'Failed to create bulk job' },
      { status: 500 }
    )
  }
}

/**
 * Mock function to count files in ZIP
 * In a real implementation, you would extract and count the files
 */
async function countFilesInZip(zipFile: File): Promise<number> {
  // Mock implementation - estimate based on file size
  // In production, use a ZIP library like 'yauzl' or 'node-stream-zip'
  const estimatedFiles = Math.max(1, Math.floor(zipFile.size / (50 * 1024))) // Assume avg 50KB per file
  return Math.min(estimatedFiles, 1000) // Cap at 1000 files
}
