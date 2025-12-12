import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCitation } from '@/lib/web-search/web-search-service'

// POST /api/web-search/results/:id/cite - Generate citation
export async function POST(
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

    // Verify ownership
    const result = await prisma.webSearchResult.findFirst({
      where: { id },
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

    const body = await request.json()
    const { format = 'bluebook' } = body

    if (!['bluebook', 'alwd'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use "bluebook" or "alwd"' },
        { status: 400 }
      )
    }

    const citation = await generateCitation(id, format)

    return NextResponse.json({
      success: true,
      format,
      citation,
    })
  } catch (error) {
    console.error('Generate citation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate citation' },
      { status: 500 }
    )
  }
}
