import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/web-search/archives/:id - Get archived content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const archive = await prisma.webSearchArchive.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!archive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      )
    }

    // Return archive data (excluding raw content for list view, include for detail)
    return NextResponse.json({
      archive: {
        id: archive.id,
        originalUrl: archive.originalUrl,
        contentHash: archive.contentHash,
        captureMethod: archive.captureMethod,
        createdAt: archive.createdAt,
        resultId: archive.resultId,
        // Include content for detail view
        archivedContent: archive.archivedContent,
        archivedHtml: archive.archivedHtml,
        captureHeaders: archive.captureHeaders,
        certificationData: archive.certificationData,
      },
    })
  } catch (error) {
    console.error('Get archive error:', error)
    return NextResponse.json(
      { error: 'Failed to get archive' },
      { status: 500 }
    )
  }
}
