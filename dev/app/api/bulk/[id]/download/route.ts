import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/bulk/[id]/download
 * Download results ZIP for a completed bulk job
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params

    const bulkJob = await prisma.bulkJob.findUnique({
      where: { id },
      include: {
        files: true,
      },
    })

    if (!bulkJob) {
      return NextResponse.json({ error: 'Bulk job not found' }, { status: 404 })
    }

    // Check permissions
    if (bulkJob.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (bulkJob.status !== 'completed') {
      return NextResponse.json(
        { error: 'Bulk job is not completed yet' },
        { status: 400 }
      )
    }

    if (!bulkJob.outputZipKey) {
      return NextResponse.json(
        { error: 'No output ZIP available' },
        { status: 404 }
      )
    }

    // In a real implementation, you would:
    // 1. Get the file from storage using bulkJob.outputZipKey
    // 2. Stream it back to the client
    // For now, we'll return a mock response

    const mockZipContent = await generateMockResultsZip(bulkJob)

    return new NextResponse(mockZipContent as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${bulkJob.name}-results.zip"`,
        'Content-Length': mockZipContent.length.toString(),
      },
    })
  } catch (error) {
    console.error('[API] Download bulk results error:', error)
    return NextResponse.json(
      { error: 'Failed to download results' },
      { status: 500 }
    )
  }
}

/**
 * Generate mock results ZIP
 * In production, this would retrieve the actual ZIP from storage
 */
async function generateMockResultsZip(bulkJob: any): Promise<Buffer> {
  // Mock ZIP content with results summary
  const resultsText = `Bulk Processing Results
Job: ${bulkJob.name}
Tool: ${bulkJob.toolId}
Total Files: ${bulkJob.totalFiles}
Processed Files: ${bulkJob.processedFiles}
Successful: ${bulkJob.successfulFiles}
Failed: ${bulkJob.failedFiles}
Completed: ${bulkJob.completedAt}

Individual file results would be included here in separate files.
`

  // In a real implementation, you would use a ZIP library to create the actual ZIP
  return Buffer.from(resultsText, 'utf-8')
}
