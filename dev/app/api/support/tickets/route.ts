import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

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
    const { subject, category, priority, message } = body

    if (!subject || !category || !message) {
      return NextResponse.json(
        { error: 'Subject, category, and message are required' },
        { status: 400 }
      )
    }

    // Generate ticket number
    const ticketCount = await prisma.supportTicket.count()
    const ticketNumber = `FRITH-${(ticketCount + 1).toString().padStart(6, '0')}`

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user.id,
        subject,
        category,
        priority: priority || 'medium',
        status: 'open',
      },
    })

    // Create first message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.id,
        senderType: 'user',
        message,
      },
    })

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
      },
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}

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
    const status = searchParams.get('status')

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
