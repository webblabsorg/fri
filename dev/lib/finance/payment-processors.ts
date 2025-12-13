import { prisma } from '@/lib/db'

// ============================================================================
// PAYMENT PROCESSOR INTEGRATIONS
// Supports Stripe, LawPay, and PayPal for legal billing payments
// ============================================================================

export type PaymentProcessor = 'stripe' | 'lawpay' | 'paypal'

export interface PaymentProcessorConfig {
  processor: PaymentProcessor
  apiKey?: string
  secretKey?: string
  merchantId?: string
  clientId?: string
  clientSecret?: string
  webhookSecret?: string
  sandbox?: boolean
}

export interface CreatePaymentIntentInput {
  processor: PaymentProcessor
  amount: number
  currency: string
  invoiceId: string
  clientId: string
  description?: string
  metadata?: Record<string, string>
}

export interface PaymentIntentResult {
  id: string
  clientSecret?: string
  status: 'pending' | 'requires_action' | 'succeeded' | 'failed'
  processor: PaymentProcessor
  amount: number
  currency: string
  redirectUrl?: string
  error?: string
}

export interface ProcessPaymentInput {
  processor: PaymentProcessor
  paymentIntentId: string
  paymentMethodId?: string
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  status: string
  error?: string
  processorResponse?: Record<string, unknown>
}

export interface RefundInput {
  processor: PaymentProcessor
  transactionId: string
  amount?: number // Partial refund if specified
  reason?: string
}

export interface RefundResult {
  success: boolean
  refundId?: string
  amount: number
  status: string
  error?: string
}

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

class StripeProcessor {
  private apiKey: string
  private baseUrl = 'https://api.stripe.com/v1'

  constructor(config: PaymentProcessorConfig) {
    this.apiKey = config.secretKey || process.env.STRIPE_SECRET_KEY || ''
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (!this.apiKey) {
      return {
        id: '',
        status: 'failed',
        processor: 'stripe',
        amount: input.amount,
        currency: input.currency,
        error: 'Stripe API key not configured',
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: Math.round(input.amount * 100).toString(), // Stripe uses cents
          currency: input.currency.toLowerCase(),
          description: input.description || `Invoice ${input.invoiceId}`,
          'metadata[invoiceId]': input.invoiceId,
          'metadata[clientId]': input.clientId,
          ...(input.metadata || {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          id: '',
          status: 'failed',
          processor: 'stripe',
          amount: input.amount,
          currency: input.currency,
          error: data.error?.message || 'Stripe API error',
        }
      }

      return {
        id: data.id,
        clientSecret: data.client_secret,
        status: data.status === 'succeeded' ? 'succeeded' : 'pending',
        processor: 'stripe',
        amount: input.amount,
        currency: input.currency,
      }
    } catch (error) {
      return {
        id: '',
        status: 'failed',
        processor: 'stripe',
        amount: input.amount,
        currency: input.currency,
        error: (error as Error).message,
      }
    }
  }

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    if (!this.apiKey) {
      return { success: false, status: 'failed', error: 'Stripe API key not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${input.paymentIntentId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: input.paymentMethodId 
          ? new URLSearchParams({ payment_method: input.paymentMethodId })
          : undefined,
      })

      const data = await response.json()

      return {
        success: data.status === 'succeeded',
        transactionId: data.id,
        status: data.status,
        processorResponse: data,
      }
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: (error as Error).message,
      }
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!this.apiKey) {
      return { success: false, amount: 0, status: 'failed', error: 'Stripe API key not configured' }
    }

    try {
      const params: Record<string, string> = {
        payment_intent: input.transactionId,
      }
      if (input.amount) {
        params.amount = Math.round(input.amount * 100).toString()
      }
      if (input.reason) {
        params.reason = input.reason
      }

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      })

      const data = await response.json()

      return {
        success: data.status === 'succeeded',
        refundId: data.id,
        amount: (data.amount || 0) / 100,
        status: data.status,
      }
    } catch (error) {
      return {
        success: false,
        amount: 0,
        status: 'failed',
        error: (error as Error).message,
      }
    }
  }
}

// ============================================================================
// LAWPAY INTEGRATION
// ============================================================================

class LawPayProcessor {
  private apiKey: string
  private baseUrl: string

  constructor(config: PaymentProcessorConfig) {
    this.apiKey = config.apiKey || process.env.LAWPAY_API_KEY || ''
    this.baseUrl = config.sandbox 
      ? 'https://api.sandbox.lawpay.com/v1'
      : 'https://api.lawpay.com/v1'
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (!this.apiKey) {
      return {
        id: '',
        status: 'failed',
        processor: 'lawpay',
        amount: input.amount,
        currency: input.currency,
        error: 'LawPay API key not configured',
      }
    }

    try {
      // LawPay uses a different API structure - create a charge request
      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(input.amount * 100),
          currency: input.currency.toUpperCase(),
          description: input.description || `Invoice ${input.invoiceId}`,
          reference: input.invoiceId,
          metadata: {
            invoiceId: input.invoiceId,
            clientId: input.clientId,
            ...input.metadata,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          id: '',
          status: 'failed',
          processor: 'lawpay',
          amount: input.amount,
          currency: input.currency,
          error: data.message || 'LawPay API error',
        }
      }

      return {
        id: data.id,
        status: 'pending',
        processor: 'lawpay',
        amount: input.amount,
        currency: input.currency,
        redirectUrl: data.hosted_payment_url,
      }
    } catch (error) {
      return {
        id: '',
        status: 'failed',
        processor: 'lawpay',
        amount: input.amount,
        currency: input.currency,
        error: (error as Error).message,
      }
    }
  }

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    if (!this.apiKey) {
      return { success: false, status: 'failed', error: 'LawPay API key not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/charges/${input.paymentIntentId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      return {
        success: data.status === 'captured' || data.status === 'succeeded',
        transactionId: data.id,
        status: data.status,
        processorResponse: data,
      }
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: (error as Error).message,
      }
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!this.apiKey) {
      return { success: false, amount: 0, status: 'failed', error: 'LawPay API key not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/charges/${input.transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: input.amount ? Math.round(input.amount * 100) : undefined,
          reason: input.reason,
        }),
      })

      const data = await response.json()

      return {
        success: data.status === 'refunded',
        refundId: data.refund_id,
        amount: (data.amount_refunded || 0) / 100,
        status: data.status,
      }
    } catch (error) {
      return {
        success: false,
        amount: 0,
        status: 'failed',
        error: (error as Error).message,
      }
    }
  }
}

// ============================================================================
// PAYPAL INTEGRATION
// ============================================================================

class PayPalProcessor {
  private clientId: string
  private clientSecret: string
  private baseUrl: string
  private accessToken: string = ''

  constructor(config: PaymentProcessorConfig) {
    this.clientId = config.clientId || process.env.PAYPAL_CLIENT_ID || ''
    this.clientSecret = config.clientSecret || process.env.PAYPAL_CLIENT_SECRET || ''
    this.baseUrl = config.sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    const data = await response.json()
    this.accessToken = data.access_token || ''
    return this.accessToken
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (!this.clientId || !this.clientSecret) {
      return {
        id: '',
        status: 'failed',
        processor: 'paypal',
        amount: input.amount,
        currency: input.currency,
        error: 'PayPal credentials not configured',
      }
    }

    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: input.invoiceId,
            description: input.description || `Invoice ${input.invoiceId}`,
            amount: {
              currency_code: input.currency.toUpperCase(),
              value: input.amount.toFixed(2),
            },
            custom_id: input.clientId,
          }],
          application_context: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          id: '',
          status: 'failed',
          processor: 'paypal',
          amount: input.amount,
          currency: input.currency,
          error: data.message || 'PayPal API error',
        }
      }

      const approveLink = data.links?.find((l: any) => l.rel === 'approve')

      return {
        id: data.id,
        status: 'pending',
        processor: 'paypal',
        amount: input.amount,
        currency: input.currency,
        redirectUrl: approveLink?.href,
      }
    } catch (error) {
      return {
        id: '',
        status: 'failed',
        processor: 'paypal',
        amount: input.amount,
        currency: input.currency,
        error: (error as Error).message,
      }
    }
  }

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    if (!this.clientId || !this.clientSecret) {
      return { success: false, status: 'failed', error: 'PayPal credentials not configured' }
    }

    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${input.paymentIntentId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      return {
        success: data.status === 'COMPLETED',
        transactionId: data.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.id,
        status: data.status,
        processorResponse: data,
      }
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: (error as Error).message,
      }
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!this.clientId || !this.clientSecret) {
      return { success: false, amount: 0, status: 'failed', error: 'PayPal credentials not configured' }
    }

    try {
      const token = await this.getAccessToken()

      const body: Record<string, unknown> = {}
      if (input.amount) {
        body.amount = {
          currency_code: 'USD', // Would need to be passed in
          value: input.amount.toFixed(2),
        }
      }
      if (input.reason) {
        body.note_to_payer = input.reason
      }

      const response = await fetch(`${this.baseUrl}/v2/payments/captures/${input.transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      return {
        success: data.status === 'COMPLETED',
        refundId: data.id,
        amount: parseFloat(data.amount?.value || '0'),
        status: data.status,
      }
    } catch (error) {
      return {
        success: false,
        amount: 0,
        status: 'failed',
        error: (error as Error).message,
      }
    }
  }
}

// ============================================================================
// PAYMENT PROCESSOR FACTORY
// ============================================================================

export function getPaymentProcessor(
  processor: PaymentProcessor,
  config?: Partial<PaymentProcessorConfig>
): {
  createPaymentIntent: (input: CreatePaymentIntentInput) => Promise<PaymentIntentResult>
  processPayment: (input: ProcessPaymentInput) => Promise<PaymentResult>
  refund: (input: RefundInput) => Promise<RefundResult>
} {
  const fullConfig: PaymentProcessorConfig = {
    processor,
    sandbox: process.env.NODE_ENV !== 'production',
    ...config,
  }

  switch (processor) {
    case 'stripe':
      return new StripeProcessor(fullConfig)
    case 'lawpay':
      return new LawPayProcessor(fullConfig)
    case 'paypal':
      return new PayPalProcessor(fullConfig)
    default:
      throw new Error(`Unsupported payment processor: ${processor}`)
  }
}

/**
 * Get list of supported payment processors
 */
export function getSupportedProcessors(): {
  processor: PaymentProcessor
  name: string
  description: string
  features: string[]
}[] {
  return [
    {
      processor: 'stripe',
      name: 'Stripe',
      description: 'Full-featured payment processing with cards, ACH, and more',
      features: ['Credit/Debit Cards', 'ACH Bank Transfers', 'Apple Pay', 'Google Pay', 'Recurring Payments'],
    },
    {
      processor: 'lawpay',
      name: 'LawPay',
      description: 'Payment processing designed specifically for law firms with trust account compliance',
      features: ['Credit/Debit Cards', 'eCheck/ACH', 'Trust Account Compliance', 'IOLTA Support', 'ABA Approved'],
    },
    {
      processor: 'paypal',
      name: 'PayPal',
      description: 'Widely recognized payment platform with buyer protection',
      features: ['PayPal Balance', 'Credit/Debit Cards', 'Pay Later Options', 'International Payments'],
    },
  ]
}

/**
 * Record a payment from a processor in the database
 */
export async function recordProcessorPayment(
  invoiceId: string,
  processor: PaymentProcessor,
  transactionId: string,
  amount: number,
  userId: string
): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { organization: true },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  await prisma.payment.create({
    data: {
      invoiceId,
      organizationId: invoice.organizationId,
      clientId: invoice.clientId,
      amount,
      currency: invoice.currency || 'USD',
      paymentMethod: processor,
      processorId: transactionId,
      referenceNumber: transactionId,
      paymentDate: new Date(),
      status: 'completed',
      notes: `Processed via ${processor}`,
      processedBy: userId,
    },
  })

  // Update invoice status if fully paid
  const payments = await prisma.payment.findMany({
    where: { invoiceId, status: 'completed' },
  })

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const invoiceTotal = Number(invoice.totalAmount || 0)

  if (totalPaid >= invoiceTotal) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'paid', paidAt: new Date() },
    })
  } else if (totalPaid > 0) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'partial' },
    })
  }
}
