import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const incidents = await prisma.systemIncident.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    })

    const maintenance = await prisma.maintenanceWindow.findMany({
      where: {
        status: { in: ['scheduled', 'in_progress'] },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      take: 5,
    })

    return NextResponse.json({
      incidents,
      maintenance,
      currentStatus: incidents.some(i => i.status !== 'resolved')
        ? 'degraded'
        : 'operational',
    })
  } catch (error) {
    console.error('Error fetching incidents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}
