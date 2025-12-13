import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { organizationId, scheduledPaymentDate } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    if (!scheduledPaymentDate) {
      return NextResponse.json({ error: 'Scheduled payment date required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const bill = await prisma.vendorBill.findFirst({
      where: { id, organizationId, status: { in: ['approved', 'pending'] } },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found or cannot be scheduled' }, { status: 404 })
    }

    if (Number(bill.balanceDue) <= 0) {
      return NextResponse.json({ error: 'Bill is already fully paid' }, { status: 400 })
    }

    const updated = await prisma.vendorBill.update({
      where: { id },
      data: {
        scheduledPaymentDate: new Date(scheduledPaymentDate),
        status: 'scheduled',
      },
      include: { vendor: true },
    })

    return NextResponse.json({ bill: updated })
  } catch (error) {
    console.error('Error scheduling vendor bill payment:', error)
    return NextResponse.json({ error: 'Failed to schedule payment' }, { status: 500 })
  }
}
