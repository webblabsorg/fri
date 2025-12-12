import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { archiveUrl } from '@/lib/web-search/web-search-service'

// POST /api/web-search/results/:id/archive - Archive the URL
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Verify ownership
    const result = await prisma.webSearchResult.findFirst({
      where: { id: params.id },
      include: {
        query: {
          select: { userId: true },
        },
      },
    })

    if (!result || result.query.userId !== user.id) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    const archived = await archiveUrl(user.id, params.id, result.sourceUrl)

    return NextResponse.json({
      success: true,
      archivedUrl: archived.archivedUrl,
    })
  } catch (error) {
    console.error('Archive URL error:', error)
    return NextResponse.json(
      { error: 'Failed to archive URL' },
      { status: 500 }
    )
  }
}
