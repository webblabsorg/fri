import Stripe from 'stripe'
import { prisma } from '../db'

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

// Pricing configuration
export const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    priceId: null, // No Stripe price for free tier
    price: 0,
    interval: null,
    features: [
      '50 AI requests per month',
      '100k tokens per month',
      'Gemini Flash model',
      'Basic legal tools',
      'Email support',
    ],
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    price: 49,
    interval: 'month' as const,
    features: [
      '1,000 AI requests per month',
      '5M tokens per month',
      'Claude 3.5 Sonnet model',
      'All legal tools',
      'Priority email support',
      'API access',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
    price: 149,
    interval: 'month' as const,
    features: [
      '5,000 AI requests per month',
      '20M tokens per month',
      'Claude 3.5 Sonnet model',
      'All legal tools',
      'Priority support',
      'API access',
      'Team collaboration (5 seats)',
      'Custom integrations',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    price: 499,
    interval: 'month' as const,
    features: [
      'Unlimited AI requests',
      'Unlimited tokens',
      'Claude 3 Opus model',
      'All legal tools',
      'Dedicated support',
      'API access',
      'Unlimited team seats',
      'Custom integrations',
      'SLA guarantee',
      'Custom training',
    ],
  },
} as const

export type PricingTier = keyof typeof PRICING_PLANS

// Create or retrieve Stripe customer
export async function getOrCreateStripeCustomer(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Return existing customer if already created
  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id,
    },
  })

  // Save customer ID to database
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

// Create checkout session for subscription
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const customerId = await getOrCreateStripeCustomer(userId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  })

  return session
}

// Create billing portal session
export async function createBillingPortalSession(
  userId: string,
  returnUrl: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    throw new Error('No Stripe customer found')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  })

  return session
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

// Update subscription
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  })
}

// Handle successful payment (webhook)
export async function handleSuccessfulPayment(
  subscriptionId: string,
  customerId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Get user from customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    throw new Error('User not found for customer')
  }

  // Determine tier from price ID
  const priceId = subscription.items.data[0].price.id
  let tier: string = 'free'

  for (const [key, plan] of Object.entries(PRICING_PLANS)) {
    if (plan.priceId === priceId) {
      tier = key.toLowerCase()
      break
    }
  }

  // Update user subscription status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
    },
  })

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId: user.id,
      stripePaymentId: subscription.latest_invoice as string,
      amount: (subscription.items.data[0].price.unit_amount || 0) / 100,
      currency: subscription.currency.toUpperCase(),
      status: 'succeeded',
      type: 'subscription',
      description: `${tier.toUpperCase()} subscription payment`,
    },
  })
}

// Handle failed payment (webhook)
export async function handleFailedPayment(
  subscriptionId: string,
  customerId: string
) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  })
}

// Handle subscription cancellation (webhook)
export async function handleSubscriptionCancellation(
  subscriptionId: string,
  customerId: string
) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'cancelled',
    },
  })
}

// Get customer's payment methods
export async function getPaymentMethods(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return []
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: 'card',
  })

  return paymentMethods.data
}

// Get customer's invoices
export async function getInvoices(userId: string, limit: number = 10) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return []
  }

  const invoices = await stripe.invoices.list({
    customer: user.stripeCustomerId,
    limit,
  })

  return invoices.data
}

// Get upcoming invoice (for preview)
export async function getUpcomingInvoice(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return null
  }

  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: user.stripeCustomerId,
    })
    return invoice
  } catch (error) {
    // No upcoming invoice
    return null
  }
}

// Validate webhook signature
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// Export stripe instance for direct access if needed
export { stripe }
