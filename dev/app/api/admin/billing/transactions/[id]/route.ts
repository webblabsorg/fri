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

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        amount: true,
        currency: true,
        status: true,
        type: true,
        stripePaymentId: true,
        paypalTransactionId: true,
        metadata: true,
        createdAt: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: transaction.userId },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
      },
    })

    // Check if within 45-day guarantee window
    const daysSincePurchase = Math.floor(
      (Date.now() - new Date(transaction.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    const within45DayWindow = daysSincePurchase <= 45

    // Check for existing refund
    const existingRefund = await prisma.refund.findFirst({
      where: { transactionId: id },
      select: {
        id: true,
        status: true,
        reason: true,
        requestedAt: true,
        processedAt: true,
      },
    })

    // Log admin view action
    await logAdminAction(adminUser.id, 'view_transaction', 'transaction', id)

    return NextResponse.json({
      transaction: {
        ...transaction,
        user,
        guaranteeInfo: {
          within45DayWindow,
          daysSincePurchase,
          daysRemaining: Math.max(0, 45 - daysSincePurchase),
        },
        refund: existingRefund,
      },
    })
  } catch (error) {
    console.error('Admin transaction detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    )
  }
}
