import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/web-search/monitors - Create a new monitor
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      monitorName,
      queryText,
      sources = ['web', 'news'],
      frequency = 'daily',
      notifyEmail = true,
      notifyInApp = true,
      minRelevanceScore = 70,
      projectId,
    } = body

    if (!monitorName || !queryText) {
      return NextResponse.json(
        { error: 'Monitor name and query text are required' },
        { status: 400 }
      )
    }

    // Calculate next run time based on frequency
    const now = new Date()
    let nextRunAt = new Date(now)
    
    switch (frequency) {
      case 'daily':
        nextRunAt.setDate(nextRunAt.getDate() + 1)
        nextRunAt.setHours(6, 0, 0, 0) // 6 AM next day
        break
      case 'weekly':
        nextRunAt.setDate(nextRunAt.getDate() + 7)
        nextRunAt.setHours(6, 0, 0, 0)
        break
      case 'realtime':
        nextRunAt.setMinutes(nextRunAt.getMinutes() + 15) // Every 15 minutes
        break
    }

    const monitor = await prisma.webSearchMonitor.create({
      data: {
        userId: user.id,
        projectId,
        monitorName,
        queryText,
        sources,
        frequency,
        notifyEmail,
        notifyInApp,
        minRelevanceScore,
        nextRunAt,
      },
    })

    return NextResponse.json({ monitor })
  } catch (error) {
    console.error('Create monitor error:', error)
    return NextResponse.json(
      { error: 'Failed to create monitor' },
      { status: 500 }
    )
  }
}

// GET /api/web-search/monitors - List monitors
export async function GET(request: NextRequest) {
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

    const monitors = await prisma.webSearchMonitor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ monitors })
  } catch (error) {
    console.error('List monitors error:', error)
    return NextResponse.json(
      { error: 'Failed to list monitors' },
      { status: 500 }
    )
  }
}
