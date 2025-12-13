import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const matterId = searchParams.get('matterId') || undefined
    const userId = searchParams.get('userId') || undefined
    const status = searchParams.get('status') || undefined
    const isBillable = searchParams.get('isBillable')
    const isBilled = searchParams.get('isBilled')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const where: Record<string, unknown> = { organizationId }

    if (matterId) where.matterId = matterId
    if (userId) where.userId = userId
    if (status) where.status = status
    if (isBillable !== null && isBillable !== undefined) {
      where.isBillable = isBillable === 'true'
    }
    if (isBilled !== null && isBilled !== undefined) {
      where.isBilled = isBilled === 'true'
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate)
    }

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          matter: { include: { client: true } },
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.timeEntry.count({ where }),
    ])

    return NextResponse.json({ timeEntries, total })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      organizationId,
      matterId,
      date,
      hours,
      rate,
      description,
      isBillable = true,
      utbmsTaskCode,
      utbmsActivityCode,
    } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!matterId || !date || hours === undefined || rate === undefined || !description) {
      return NextResponse.json(
        { error: 'Matter, date, hours, rate, and description are required' },
        { status: 400 }
      )
    }

    const amount = hours * rate

    const timeEntry = await prisma.timeEntry.create({
      data: {
        organizationId,
        userId: user.id,
        matterId,
        date: new Date(date),
        hours: new Decimal(hours),
        rate: new Decimal(rate),
        amount: new Decimal(amount),
        description,
        isBillable,
        utbmsTaskCode,
        utbmsActivityCode,
        status: 'draft',
      },
      include: {
        matter: { include: { client: true } },
      },
    })

    return NextResponse.json({ timeEntry }, { status: 201 })
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 })
  }
}
