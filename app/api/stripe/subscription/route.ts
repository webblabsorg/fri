import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getInvoices, getPaymentMethods, getUpcomingInvoice } from '@/lib/stripe/stripe-service'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from session
    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get user's current subscription info
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
      },
    })

    // Get invoices
    const invoices = await getInvoices(user.id, 10)

    // Get payment methods
    const paymentMethods = await getPaymentMethods(user.id)

    // Get upcoming invoice
    const upcomingInvoice = await getUpcomingInvoice(user.id)

    return NextResponse.json({
      subscription: {
        tier: userDetails?.subscriptionTier || 'free',
        status: userDetails?.subscriptionStatus || 'active',
        hasStripeCustomer: !!userDetails?.stripeCustomerId,
      },
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        invoicePdf: invoice.invoice_pdf,
      })),
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      })),
      upcomingInvoice: upcomingInvoice
        ? {
            amount: upcomingInvoice.amount_due / 100,
            currency: upcomingInvoice.currency.toUpperCase(),
            date: new Date(upcomingInvoice.period_end * 1000),
          }
        : null,
    })
  } catch (error) {
    console.error('Subscription info error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve subscription info' },
      { status: 500 }
    )
  }
}
