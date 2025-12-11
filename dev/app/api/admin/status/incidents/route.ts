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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const where: any = {}
    if (status) {
      where.status = status
    }

    const incidents = await prisma.systemIncident.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ incidents })
  } catch (error) {
    console.error('Error fetching incidents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
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
      status,
      severity,
      affectedServices,
      startedAt,
    } = body

    if (!title || !description || !status || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const incident = await prisma.systemIncident.create({
      data: {
        title,
        description,
        status,
        severity,
        affectedServices: affectedServices || [],
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        createdBy: (session.user as any).id,
      },
    })

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Error creating incident:', error)
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    )
  }
}
