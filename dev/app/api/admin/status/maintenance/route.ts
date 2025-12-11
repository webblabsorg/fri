import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const windows = await prisma.maintenanceWindow.findMany({
      orderBy: { scheduledStart: 'desc' },
      take: 50,
    })

    return NextResponse.json({ windows })
  } catch (error) {
    console.error('Error fetching maintenance windows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance windows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      scheduledStart,
      scheduledEnd,
      affectedServices,
    } = body

    if (!title || !description || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const window = await prisma.maintenanceWindow.create({
      data: {
        title,
        description,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        affectedServices: affectedServices || [],
        status: 'scheduled',
      },
    })

    return NextResponse.json({ window })
  } catch (error) {
    console.error('Error creating maintenance window:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance window' },
      { status: 500 }
    )
  }
}
