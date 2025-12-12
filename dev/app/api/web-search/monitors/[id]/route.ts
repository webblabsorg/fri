import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/web-search/monitors/:id - Get monitor details
export async function GET(
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

    const monitor = await prisma.webSearchMonitor.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ monitor })
  } catch (error) {
    console.error('Get monitor error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitor' },
      { status: 500 }
    )
  }
}

// PATCH /api/web-search/monitors/:id - Update monitor
export async function PATCH(
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
    const existing = await prisma.webSearchMonitor.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      monitorName,
      queryText,
      sources,
      frequency,
      notifyEmail,
      notifyInApp,
      minRelevanceScore,
      isActive,
    } = body

    const monitor = await prisma.webSearchMonitor.update({
      where: { id: params.id },
      data: {
        monitorName: monitorName ?? existing.monitorName,
        queryText: queryText ?? existing.queryText,
        sources: sources ?? existing.sources,
        frequency: frequency ?? existing.frequency,
        notifyEmail: notifyEmail ?? existing.notifyEmail,
        notifyInApp: notifyInApp ?? existing.notifyInApp,
        minRelevanceScore: minRelevanceScore ?? existing.minRelevanceScore,
        isActive: isActive ?? existing.isActive,
      },
    })

    return NextResponse.json({ monitor })
  } catch (error) {
    console.error('Update monitor error:', error)
    return NextResponse.json(
      { error: 'Failed to update monitor' },
      { status: 500 }
    )
  }
}

// DELETE /api/web-search/monitors/:id - Delete monitor
export async function DELETE(
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
    const monitor = await prisma.webSearchMonitor.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      )
    }

    await prisma.webSearchMonitor.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete monitor error:', error)
    return NextResponse.json(
      { error: 'Failed to delete monitor' },
      { status: 500 }
    )
  }
}
