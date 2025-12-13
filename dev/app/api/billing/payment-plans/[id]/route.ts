import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(
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
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const plan = await prisma.paymentPlan.findFirst({
      where: { id, organizationId },
      include: {
        invoice: { select: { invoiceNumber: true, totalAmount: true, balanceDue: true } },
        client: { select: { displayName: true, email: true } },
        installments: { orderBy: { installmentNumber: 'asc' } },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error fetching payment plan:', error)
    return NextResponse.json({ error: 'Failed to fetch payment plan' }, { status: 500 })
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
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { organizationId, action, installmentId, paymentId } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const plan = await prisma.paymentPlan.findFirst({
      where: { id, organizationId },
      include: { installments: true },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 })
    }

    // Handle different actions
    if (action === 'cancel') {
      const updated = await prisma.paymentPlan.update({
        where: { id },
        data: { status: 'cancelled' },
      })
      return NextResponse.json({ plan: updated })
    }

    if (action === 'mark_installment_paid' && installmentId) {
      const installment = plan.installments.find((i) => i.id === installmentId)
      if (!installment) {
        return NextResponse.json({ error: 'Installment not found' }, { status: 404 })
      }

      await prisma.paymentPlanInstallment.update({
        where: { id: installmentId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentId,
        },
      })

      // Update plan totals
      const newPaidAmount = Number(plan.paidAmount) + Number(installment.amount)
      const newRemainingAmount = Number(plan.totalAmount) - newPaidAmount

      const allPaid = plan.installments.every(
        (i) => i.id === installmentId || i.status === 'paid'
      )

      await prisma.paymentPlan.update({
        where: { id },
        data: {
          paidAmount: new Decimal(newPaidAmount),
          remainingAmount: new Decimal(newRemainingAmount),
          status: allPaid ? 'completed' : 'active',
        },
      })

      const updated = await prisma.paymentPlan.findUnique({
        where: { id },
        include: { installments: { orderBy: { installmentNumber: 'asc' } } },
      })

      return NextResponse.json({ plan: updated })
    }

    if (action === 'update_auto_charge') {
      const { autoCharge, paymentMethodId, processor } = body
      const updated = await prisma.paymentPlan.update({
        where: { id },
        data: {
          autoCharge: autoCharge ?? plan.autoCharge,
          paymentMethodId: paymentMethodId ?? plan.paymentMethodId,
          processor: processor ?? plan.processor,
        },
      })
      return NextResponse.json({ plan: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating payment plan:', error)
    return NextResponse.json({ error: 'Failed to update payment plan' }, { status: 500 })
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const plan = await prisma.paymentPlan.findFirst({
      where: { id, organizationId },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Payment plan not found' }, { status: 404 })
    }

    // Only allow deletion of plans with no payments made
    if (Number(plan.paidAmount) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment plan with payments already made. Cancel instead.' },
        { status: 400 }
      )
    }

    await prisma.paymentPlan.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment plan:', error)
    return NextResponse.json({ error: 'Failed to delete payment plan' }, { status: 500 })
  }
}
