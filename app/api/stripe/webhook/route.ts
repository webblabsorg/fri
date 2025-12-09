import { NextRequest, NextResponse } from 'next/server'
import {
  validateWebhookSignature,
  handleSuccessfulPayment,
  handleFailedPayment,
  handleSubscriptionCancellation,
} from '@/lib/stripe/stripe-service'
import Stripe from 'stripe'

// Disable body parsing - Stripe needs raw body for webhook verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Validate webhook signature
    let event: Stripe.Event
    try {
      event = validateWebhookSignature(body, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription && session.customer) {
          await handleSuccessfulPayment(
            session.subscription as string,
            session.customer as string
          )
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription && invoice.customer) {
          await handleSuccessfulPayment(
            invoice.subscription as string,
            invoice.customer as string
          )
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription && invoice.customer) {
          await handleFailedPayment(
            invoice.subscription as string,
            invoice.customer as string
          )
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.customer) {
          await handleSubscriptionCancellation(
            subscription.id,
            subscription.customer as string
          )
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.customer && subscription.status === 'active') {
          await handleSuccessfulPayment(
            subscription.id,
            subscription.customer as string
          )
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
