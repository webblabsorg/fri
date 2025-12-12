import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/web-search/queries/:id - Get query details with results
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

    const query = await prisma.webSearchQuery.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        results: {
          orderBy: { relevanceScore: 'desc' },
        },
      },
    })

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ query })
  } catch (error) {
    console.error('Get query error:', error)
    return NextResponse.json(
      { error: 'Failed to get query' },
      { status: 500 }
    )
  }
}

// DELETE /api/web-search/queries/:id - Delete a query and its results
export async function DELETE(
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
    const query = await prisma.webSearchQuery.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }

    // Delete query (results will cascade delete)
    await prisma.webSearchQuery.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete query error:', error)
    return NextResponse.json(
      { error: 'Failed to delete query' },
      { status: 500 }
    )
  }
}
