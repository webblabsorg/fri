import { NextRequest, NextResponse } from 'next/server'
import {
  validateWebhookSignature,
  handleSuccessfulPayment,
  handleFailedPayment,
  handleSubscriptionCancellation,
  handleOrganizationSuccessfulPayment,
  handleOrganizationSubscriptionCancellation,
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
          // Check if this is an organization subscription
          const isOrganization = session.metadata?.type === 'organization'
          
          if (isOrganization) {
            await handleOrganizationSuccessfulPayment(
              session.subscription as string,
              session.customer as string
            )
          } else {
            await handleSuccessfulPayment(
              session.subscription as string,
              session.customer as string
            )
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id
        
        if (subscriptionId && customerId) {
          // Get subscription to check metadata
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const isOrganization = subscription.metadata?.type === 'organization'
          
          if (isOrganization) {
            await handleOrganizationSuccessfulPayment(subscriptionId, customerId)
          } else {
            await handleSuccessfulPayment(subscriptionId, customerId)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id
        
        if (subscriptionId && customerId) {
          await handleFailedPayment(subscriptionId, customerId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.customer) {
          // Check if this is an organization subscription
          const isOrganization = subscription.metadata?.type === 'organization'
          
          if (isOrganization) {
            await handleOrganizationSubscriptionCancellation(
              subscription.id,
              subscription.customer as string
            )
          } else {
            await handleSubscriptionCancellation(
              subscription.id,
              subscription.customer as string
            )
          }
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
