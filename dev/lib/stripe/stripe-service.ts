import Stripe from 'stripe'
import { prisma } from '../db'

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
})

// Pricing configuration - stored in code, easily updatable
export const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      '50 AI requests per month',
      '100k tokens per month',
      'Gemini Flash model',
      'Basic legal tools',
      'Email support',
    ],
    description: 'Perfect for trying out the platform',
  },
  PRO: {
    name: 'Pro',
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
    description: 'For individual legal professionals',
  },
  PROFESSIONAL: {
    name: 'Professional',
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
    description: 'For small to medium law firms',
  },
  ENTERPRISE: {
    name: 'Enterprise',
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
    description: 'For large law firms and enterprises',
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

// Create checkout session with dynamic pricing (no pre-created prices needed!)
export async function createCheckoutSession(
  userId: string,
  tier: PricingTier,
  successUrl: string,
  cancelUrl: string
) {
  const customerId = await getOrCreateStripeCustomer(userId)
  const plan = PRICING_PLANS[tier]

  if (!plan || plan.price === 0) {
    throw new Error('Invalid pricing tier')
  }

  // Create checkout session with dynamic price_data
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: plan.price * 100, // Convert to cents
          recurring: plan.interval
            ? {
                interval: plan.interval,
                interval_count: 1,
              }
            : undefined,
          product_data: {
            name: `Frith AI ${plan.name} Plan`,
            description: plan.description,
            metadata: {
              tier: tier.toLowerCase(),
              plan_name: plan.name,
            },
          },
        },
        quantity: 1,
      },
    ],
    mode: plan.interval ? 'subscription' : 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier: tier.toLowerCase(),
      plan_name: plan.name,
    },
    subscription_data: plan.interval
      ? {
          metadata: {
            userId,
            tier: tier.toLowerCase(),
          },
        }
      : undefined,
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

// Update subscription to new tier
export async function updateSubscription(
  subscriptionId: string,
  newTier: PricingTier
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const plan = PRICING_PLANS[newTier]

  if (!plan || plan.price === 0) {
    throw new Error('Invalid pricing tier')
  }

  // For subscriptions, we need to create a product first, then update
  // This is a simplified version - in production, you'd want to cache products
  const product = await stripe.products.create({
    name: `Frith AI ${plan.name} Plan`,
    description: plan.description,
    metadata: {
      tier: newTier.toLowerCase(),
    },
  })

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: plan.price * 100,
    recurring: {
      interval: plan.interval || 'month',
      interval_count: 1,
    },
  })

  // Update the subscription to use the new price
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: price.id,
      },
    ],
    metadata: {
      tier: newTier.toLowerCase(),
    },
    proration_behavior: 'create_prorations',
  })
}

// Handle successful payment (webhook) - reads tier from metadata
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

  // Get tier from subscription metadata (much more reliable!)
  const tier = subscription.metadata.tier || 'free'
  const amount = (subscription.items.data[0].price.unit_amount || 0) / 100

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
      amount,
      currency: subscription.currency.toUpperCase(),
      status: 'completed',
      type: 'subscription',
      metadata: {
        tier,
        planName: tier.toUpperCase(),
        subscriptionId: subscription.id,
      },
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
    // Use any type for Stripe SDK compatibility
    const invoice = await (stripe.invoices as any).retrieveUpcoming({
      customer: user.stripeCustomerId,
    })
    return invoice
  } catch {
    // No upcoming invoice or customer has no subscription
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

// ============================================================================
// ORGANIZATION-LEVEL BILLING FUNCTIONS
// ============================================================================

// Create or retrieve Stripe customer for organization
export async function getOrCreateOrganizationStripeCustomer(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      billingEmail: true,
      stripeSubscriptionId: true,
      members: {
        where: { role: 'owner', status: 'active' },
        include: {
          user: {
            select: { email: true, name: true }
          }
        },
        take: 1
      }
    },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Get owner for billing contact
  const owner = organization.members[0]?.user
  if (!owner) {
    throw new Error('Organization has no owner')
  }

  // Check if organization already has a Stripe customer
  if (organization.stripeSubscriptionId) {
    // Get subscription to find customer
    const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)
    return subscription.customer as string
  }

  // Create new Stripe customer for organization
  const customer = await stripe.customers.create({
    email: organization.billingEmail || owner.email,
    name: organization.name,
    metadata: {
      organizationId: organization.id,
      type: 'organization'
    },
  })

  return customer.id
}

// Create checkout session for organization
export async function createOrganizationCheckoutSession(
  organizationId: string,
  tier: PricingTier,
  successUrl: string,
  cancelUrl: string,
  seats: number = 1
) {
  const customerId = await getOrCreateOrganizationStripeCustomer(organizationId)
  const plan = PRICING_PLANS[tier]

  if (!plan || plan.price === 0) {
    throw new Error('Invalid pricing tier')
  }

  // Calculate price based on seats for team plans
  const unitAmount = tier === 'PROFESSIONAL' || tier === 'ENTERPRISE' 
    ? plan.price * 100 // Base price per seat
    : plan.price * 100 // Fixed price for other plans

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          recurring: plan.interval
            ? {
                interval: plan.interval,
                interval_count: 1,
              }
            : undefined,
          product_data: {
            name: `Frith AI ${plan.name} Plan`,
            description: `${plan.description} (${seats} seats)`,
            metadata: {
              tier: tier.toLowerCase(),
              plan_name: plan.name,
              seats: seats.toString(),
              type: 'organization'
            },
          },
        },
        quantity: seats,
      },
    ],
    mode: plan.interval ? 'subscription' : 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId,
      tier: tier.toLowerCase(),
      plan_name: plan.name,
      seats: seats.toString(),
      type: 'organization'
    },
    subscription_data: plan.interval
      ? {
          metadata: {
            organizationId,
            tier: tier.toLowerCase(),
            seats: seats.toString(),
            type: 'organization'
          },
        }
      : undefined,
  })

  return session
}

// Create billing portal session for organization
export async function createOrganizationBillingPortalSession(
  organizationId: string,
  returnUrl: string
) {
  const customerId = await getOrCreateOrganizationStripeCustomer(organizationId)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// Handle successful organization payment (webhook)
export async function handleOrganizationSuccessfulPayment(
  subscriptionId: string,
  customerId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Get organization from customer metadata
  const customer = await stripe.customers.retrieve(customerId)
  const organizationId = (customer as any).metadata?.organizationId

  if (!organizationId) {
    throw new Error('Organization ID not found in customer metadata')
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        where: { role: 'owner', status: 'active' },
        take: 1
      }
    }
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Get tier and seats from subscription metadata
  const tier = subscription.metadata.tier || 'free'
  const seats = parseInt(subscription.metadata.seats || '1')
  const amount = (subscription.items.data[0].price.unit_amount || 0) / 100

  // Update organization subscription status
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      planTier: tier,
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      seatsTotal: seats,
    },
  })

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId: organization.members[0]?.userId || '',
      organizationId: organizationId,
      stripePaymentId: subscription.latest_invoice as string,
      amount: amount * seats,
      currency: subscription.currency.toUpperCase(),
      status: 'completed',
      type: 'subscription',
      metadata: {
        tier,
        planName: tier.toUpperCase(),
        subscriptionId: subscription.id,
        seats: seats.toString(),
        type: 'organization'
      },
    },
  })
}

// Handle organization subscription cancellation
export async function handleOrganizationSubscriptionCancellation(
  subscriptionId: string,
  customerId: string
) {
  const customer = await stripe.customers.retrieve(customerId)
  const organizationId = (customer as any).metadata?.organizationId

  if (!organizationId) return

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      planTier: 'free',
      subscriptionStatus: 'cancelled',
      stripeSubscriptionId: null,
      seatsTotal: 1,
    },
  })
}

// Update organization subscription seats
export async function updateOrganizationSeats(
  organizationId: string,
  newSeats: number
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeSubscriptionId: true }
  })

  if (!organization?.stripeSubscriptionId) {
    throw new Error('No active subscription found')
  }

  const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)
  
  // Update subscription quantity
  await stripe.subscriptions.update(organization.stripeSubscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        quantity: newSeats,
      },
    ],
    metadata: {
      ...subscription.metadata,
      seats: newSeats.toString(),
    },
    proration_behavior: 'create_prorations',
  })

  // Update organization
  await prisma.organization.update({
    where: { id: organizationId },
    data: { seatsTotal: newSeats }
  })
}

// Get organization billing info
export async function getOrganizationBilling(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      planTier: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      seatsTotal: true,
      seatsUsed: true,
      billingEmail: true,
    }
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  let subscription = null
  if (organization.stripeSubscriptionId) {
    subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)
  }

  return {
    ...organization,
    subscription
  }
}

// Export stripe instance for direct access if needed
export { stripe }
