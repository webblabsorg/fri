import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCitation, archiveUrl, saveResultToProject } from '@/lib/web-search/web-search-service'

// GET /api/web-search/results/:id - Get result details
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

    const result = await prisma.webSearchResult.findFirst({
      where: { id },
      include: {
        query: {
          select: {
            userId: true,
            queryText: true,
          },
        },
      },
    })

    if (!result || result.query.userId !== user.id) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Get result error:', error)
    return NextResponse.json(
      { error: 'Failed to get result' },
      { status: 500 }
    )
  }
}

// PATCH /api/web-search/results/:id - Update result (notes, tags)
export async function PATCH(
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
    const { userNotes, userTags } = body

    const updated = await prisma.webSearchResult.update({
      where: { id },
      data: {
        userNotes: userNotes !== undefined ? userNotes : result.userNotes,
        userTags: userTags !== undefined ? userTags : result.userTags,
      },
    })

    return NextResponse.json({ result: updated })
  } catch (error) {
    console.error('Update result error:', error)
    return NextResponse.json(
      { error: 'Failed to update result' },
      { status: 500 }
    )
  }
}
