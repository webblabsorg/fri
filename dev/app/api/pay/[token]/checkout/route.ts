import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { processor } = body as { processor: 'stripe' | 'lawpay' | 'paypal' }

    if (!processor || !['stripe', 'lawpay', 'paypal'].includes(processor)) {
      return NextResponse.json({ error: 'Invalid payment processor' }, { status: 400 })
    }

    const accessToken = await prisma.invoiceAccessToken.findUnique({
      where: { token },
      include: {
        invoice: {
          include: {
            organization: { select: { id: true, name: true } },
            client: { select: { displayName: true, email: true } },
          },
        },
      },
    })

    if (!accessToken) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    if (accessToken.expiresAt && new Date() > accessToken.expiresAt) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
    }

    const invoice = accessToken.invoice

    if (invoice.status === 'paid' || Number(invoice.balanceDue) <= 0) {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${appUrl}/pay/${token}?status=success`
    const cancelUrl = `${appUrl}/pay/${token}?status=cancelled`
    const amount = Number(invoice.balanceDue)
    const currency = invoice.currency.toLowerCase()

    if (processor === 'stripe') {
      const stripeKey = process.env.STRIPE_SECRET_KEY
      if (!stripeKey) {
        return NextResponse.json({ error: 'Stripe payments not configured' }, { status: 503 })
      }

      const stripe = require('stripe')(stripeKey)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: `Payment to ${invoice.organization.name}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: invoice.client.email || undefined,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          organizationId: invoice.organizationId,
          accessToken: token,
        },
      })

      return NextResponse.json({ redirectUrl: session.url })
    }

    if (processor === 'lawpay') {
      const lawpayKey = process.env.LAWPAY_API_KEY
      if (!lawpayKey) {
        return NextResponse.json({ error: 'LawPay payments not configured' }, { status: 503 })
      }

      return NextResponse.json({
        error: 'LawPay integration requires additional setup. Please contact support.',
      }, { status: 503 })
    }

    if (processor === 'paypal') {
      const paypalClientId = process.env.PAYPAL_CLIENT_ID
      const paypalSecret = process.env.PAYPAL_CLIENT_SECRET
      if (!paypalClientId || !paypalSecret) {
        return NextResponse.json({ error: 'PayPal payments not configured' }, { status: 503 })
      }

      const paypalBase = process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com'

      const authRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      })

      if (!authRes.ok) {
        return NextResponse.json({ error: 'PayPal authentication failed' }, { status: 503 })
      }

      const authData = await authRes.json()
      const accessTokenPaypal = authData.access_token

      const orderRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessTokenPaypal}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: invoice.id,
              description: `Invoice ${invoice.invoiceNumber}`,
              amount: {
                currency_code: invoice.currency,
                value: amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: successUrl,
            cancel_url: cancelUrl,
            brand_name: invoice.organization.name,
          },
        }),
      })

      if (!orderRes.ok) {
        return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 503 })
      }

      const orderData = await orderRes.json()
      const approveLink = orderData.links?.find((l: any) => l.rel === 'approve')

      if (!approveLink?.href) {
        return NextResponse.json({ error: 'PayPal order missing approval link' }, { status: 503 })
      }

      return NextResponse.json({ redirectUrl: approveLink.href })
    }

    return NextResponse.json({ error: 'Unknown processor' }, { status: 400 })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
