import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-11-17.clover' })
  : null

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    // Fetch refunds
    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          requestedAt: 'desc',
        },
        select: {
          id: true,
          transactionId: true,
          userId: true,
          amount: true,
          reason: true,
          status: true,
          requestedAt: true,
          processedAt: true,
        },
      }),
      prisma.refund.count({ where }),
    ])

    // Get user info for each refund
    const refundsWithUsers = await Promise.all(
      refunds.map(async (refund) => {
        const user = await prisma.user.findUnique({
          where: { id: refund.userId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
        return { ...refund, user }
      })
    )

    return NextResponse.json({
      refunds: refundsWithUsers,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin refunds API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { transactionId, reason, notes } = body

    if (!transactionId || !reason) {
      return NextResponse.json(
        { error: 'Transaction ID and reason are required' },
        { status: 400 }
      )
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        stripePaymentId: true,
        createdAt: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Check if already refunded
    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { error: 'Transaction already refunded' },
        { status: 400 }
      )
    }

    // Check existing refund request
    const existingRefund = await prisma.refund.findFirst({
      where: { transactionId },
    })

    if (existingRefund) {
      return NextResponse.json(
        { error: 'Refund request already exists for this transaction' },
        { status: 400 }
      )
    }

    // Validate 45-day guarantee window
    const daysSincePurchase = Math.floor(
      (Date.now() - new Date(transaction.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    const within45DayWindow = daysSincePurchase <= 45

    // Create refund request
    const refund = await prisma.refund.create({
      data: {
        transactionId,
        userId: transaction.userId,
        amount: transaction.amount,
        reason: `${reason}${notes ? `\n\nNotes: ${notes}` : ''}`,
        status: 'pending',
      },
    })

    // Process refund via Stripe if within guarantee window and has Stripe payment
    if (within45DayWindow && transaction.stripePaymentId && stripe) {
      try {
        // Process Stripe refund
        const stripeRefund = await stripe.refunds.create({
          payment_intent: transaction.stripePaymentId,
          reason: 'requested_by_customer',
        })

        // Update refund and transaction status
        await prisma.$transaction([
          prisma.refund.update({
            where: { id: refund.id },
            data: {
              status: 'processed',
              processedAt: new Date(),
            },
          }),
          prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'refunded',
            },
          }),
        ])

        // Log admin action
        await logAdminAction(adminUser.id, 'process_refund', 'transaction', transactionId, {
          refundId: refund.id,
          amount: transaction.amount,
          reason,
          within45DayWindow,
          stripeRefundId: stripeRefund.id,
        })

        return NextResponse.json({
          success: true,
          refund: {
            ...refund,
            status: 'processed',
            processedAt: new Date(),
          },
          message: 'Refund processed successfully via Stripe',
        })
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError)
        
        // Update refund status to indicate failure
        await prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: 'rejected',
            reason: `${reason}\n\nStripe Error: ${stripeError.message}`,
          },
        })

        return NextResponse.json(
          { error: `Stripe refund failed: ${stripeError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Manual approval required (outside guarantee window or no Stripe ID)
      await logAdminAction(adminUser.id, 'create_refund_request', 'transaction', transactionId, {
        refundId: refund.id,
        amount: transaction.amount,
        reason,
        within45DayWindow,
        requiresManualApproval: true,
      })

      return NextResponse.json({
        success: true,
        refund,
        message: within45DayWindow
          ? 'Refund request created (manual processing required)'
          : 'Refund request created - outside 45-day guarantee window (requires approval)',
      })
    }
  } catch (error) {
    console.error('Admin process refund error:', error)
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}
