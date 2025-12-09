import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(
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

    const { id: ticketId } = await params
    const body = await request.json()
    const { message, internal = false } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get ticket details
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        userId: true,
        status: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Create message
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: adminUser.id,
        senderType: internal ? 'system' : 'admin',
        message: message.trim(),
      },
      select: {
        id: true,
        senderId: true,
        senderType: true,
        message: true,
        createdAt: true,
      },
    })

    // Update ticket status and timestamp
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: ticket.status === 'resolved' ? 'in_progress' : ticket.status,
        updatedAt: new Date(),
      },
    })

    // Send email notification to user (if not internal note)
    if (!internal) {
      try {
        await sendEmail({
          to: ticket.user.email,
          subject: `Re: ${ticket.subject} [Ticket #${ticket.ticketNumber}]`,
          html: `
            <h2>New Response to Your Support Ticket</h2>
            <p>Hello ${ticket.user.name},</p>
            <p>A support team member has replied to your ticket:</p>
            <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>
              <strong>Ticket #:</strong> ${ticket.ticketNumber}<br>
              <strong>Subject:</strong> ${ticket.subject}
            </p>
            <p><a href="${process.env.NEXTAUTH_URL}/support/tickets/${ticketId}">View Ticket</a></p>
            <hr />
            <p style="color: #666; font-size: 12px;">
              This is an automated message from Frith AI Support.
            </p>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send ticket reply email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Log admin action
    await logAdminAction(adminUser.id, 'reply_ticket', 'ticket', ticketId, {
      messageLength: message.length,
      internal,
    })

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error('Admin ticket reply error:', error)
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    )
  }
}
