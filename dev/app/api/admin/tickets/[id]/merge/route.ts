import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { targetTicketId } = body

    if (!targetTicketId) {
      return NextResponse.json(
        { error: 'Target ticket ID is required' },
        { status: 400 }
      )
    }

    if (id === targetTicketId) {
      return NextResponse.json(
        { error: 'Cannot merge ticket into itself' },
        { status: 400 }
      )
    }

    // Verify both tickets exist
    const [sourceTicket, targetTicket] = await Promise.all([
      prisma.supportTicket.findUnique({ where: { id } }),
      prisma.supportTicket.findUnique({ where: { id: targetTicketId } })
    ])

    if (!sourceTicket) {
      return NextResponse.json(
        { error: 'Source ticket not found' },
        { status: 404 }
      )
    }

    if (!targetTicket) {
      return NextResponse.json(
        { error: 'Target ticket not found' },
        { status: 404 }
      )
    }

    // Update the source ticket to merge it into the target
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        mergedIntoId: targetTicketId,
        status: 'closed',
        resolvedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    })
  } catch (error) {
    console.error('Error merging ticket:', error)
    return NextResponse.json(
      { error: 'Failed to merge ticket' },
      { status: 500 }
    )
  }
}
