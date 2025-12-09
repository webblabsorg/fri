import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        ticketNumber: true,
        userId: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firmName: true,
            subscriptionTier: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            senderId: true,
            senderType: true,
            message: true,
            createdAt: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Log admin view action
    await logAdminAction(adminUser.id, 'view_ticket', 'ticket', id)

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Admin ticket detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, priority, assignedTo, category } = body

    // Build update data
    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null
    if (category) updateData.category = category

    // If closing/resolving ticket, set resolvedAt
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date()
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        status: true,
        priority: true,
        assignedTo: true,
        category: true,
        resolvedAt: true,
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'update_ticket', 'ticket', id, {
      changes: body,
    })

    return NextResponse.json({ ticket: updatedTicket })
  } catch (error) {
    console.error('Admin ticket update error:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}
