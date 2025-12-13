/**
 * Payment Processor Integration Service
 * Integrations for Stripe, LawPay, and PayPal
 * 
 * IMPORTANT: Methods fail closed - they return errors instead of mock success
 * when credentials are not configured or API calls are not implemented.
 */

export type PaymentProcessor = 'stripe' | 'lawpay' | 'paypal'

export interface ProcessorConfig {
  processor: PaymentProcessor
  apiKey?: string
  secretKey?: string
  merchantId?: string
  sandbox?: boolean
}

export interface ChargeRequest {
  amount: number
  currency: string
  customerId?: string
  paymentMethodId?: string
  description?: string
  metadata?: Record<string, string>
}

export interface ChargeResult {
  success: boolean
  transactionId?: string
  processorFee?: number
  error?: string
  rawResponse?: unknown
}

export interface RefundRequest {
  transactionId: string
  amount?: number // Partial refund if specified
  reason?: string
}

export interface RefundResult {
  success: boolean
  refundId?: string
  error?: string
}

export interface CustomerCreateRequest {
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

export interface CustomerResult {
  success: boolean
  customerId?: string
  error?: string
}

export interface PaymentMethodResult {
  success: boolean
  paymentMethodId?: string
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  error?: string
}

// ============================================================================
// STRIPE INTEGRATION STUB
// ============================================================================

export class StripeProcessor {
  private apiKey: string
  private sandbox: boolean

  constructor(config: ProcessorConfig) {
    this.apiKey = config.apiKey || process.env.STRIPE_SECRET_KEY || ''
    this.sandbox = config.sandbox ?? !process.env.NODE_ENV?.includes('production')
  }

  async createCustomer(request: CustomerCreateRequest): Promise<CustomerResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Stripe API key not configured' }
    }

    try {
      const Stripe = require('stripe')
      const stripe = new Stripe(this.apiKey)
      const customer = await stripe.customers.create({
        email: request.email,
        name: request.name,
        phone: request.phone,
        metadata: request.metadata,
      })
      return { success: true, customerId: customer.id }
    } catch (error) {
      console.error('[Stripe] Failed to create customer:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Stripe API key not configured' }
    }

    try {
      const Stripe = require('stripe')
      const stripe = new Stripe(this.apiKey)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100),
        currency: request.currency.toLowerCase(),
        customer: request.customerId,
        payment_method: request.paymentMethodId,
        confirm: true,
        metadata: request.metadata,
      })

      const processorFee = request.amount * 0.029 + 0.30
      return {
        success: true,
        transactionId: paymentIntent.id,
        processorFee,
        rawResponse: paymentIntent,
      }
    } catch (error) {
      console.error('[Stripe] Charge failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Stripe API key not configured' }
    }

    try {
      const Stripe = require('stripe')
      const stripe = new Stripe(this.apiKey)
      const refund = await stripe.refunds.create({
        payment_intent: request.transactionId,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
        reason: request.reason as any,
      })
      return { success: true, refundId: refund.id }
    } catch (error) {
      console.error('[Stripe] Refund failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<PaymentMethodResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Stripe API key not configured' }
    }

    try {
      const Stripe = require('stripe')
      const stripe = new Stripe(this.apiKey)
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
      return {
        success: true,
        paymentMethodId: paymentMethod.id,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
      }
    } catch (error) {
      console.error('[Stripe] Attach payment method failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}

// ============================================================================
// LAWPAY INTEGRATION STUB
// ============================================================================

export class LawPayProcessor {
  private apiKey: string
  private merchantId: string
  private sandbox: boolean

  constructor(config: ProcessorConfig) {
    this.apiKey = config.apiKey || process.env.LAWPAY_API_KEY || ''
    this.merchantId = config.merchantId || process.env.LAWPAY_MERCHANT_ID || ''
    this.sandbox = config.sandbox ?? !process.env.NODE_ENV?.includes('production')
  }

  async createCustomer(request: CustomerCreateRequest): Promise<CustomerResult> {
    if (!this.apiKey || !this.merchantId) {
      return { success: false, error: 'LawPay credentials not configured' }
    }

    // LawPay integration requires merchant-specific setup
    // Contact LawPay for API access and implementation details
    return {
      success: false,
      error: 'LawPay integration not implemented. Contact support for setup.',
    }
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    if (!this.apiKey || !this.merchantId) {
      return { success: false, error: 'LawPay credentials not configured' }
    }

    // LawPay integration requires merchant-specific setup
    // Contact LawPay for API access and implementation details
    return {
      success: false,
      error: 'LawPay integration not implemented. Contact support for setup.',
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    if (!this.apiKey || !this.merchantId) {
      return { success: false, error: 'LawPay credentials not configured' }
    }

    // LawPay integration requires merchant-specific setup
    return {
      success: false,
      error: 'LawPay integration not implemented. Contact support for setup.',
    }
  }

  async chargeToTrustAccount(request: ChargeRequest): Promise<ChargeResult> {
    if (!this.apiKey || !this.merchantId) {
      return { success: false, error: 'LawPay credentials not configured' }
    }

    // LawPay trust account routing requires merchant-specific setup
    return {
      success: false,
      error: 'LawPay trust account integration not implemented. Contact support for setup.',
    }
  }
}

// ============================================================================
// PAYPAL INTEGRATION STUB
// ============================================================================

export class PayPalProcessor {
  private clientId: string
  private secretKey: string
  private sandbox: boolean

  constructor(config: ProcessorConfig) {
    this.clientId = config.apiKey || process.env.PAYPAL_CLIENT_ID || ''
    this.secretKey = config.secretKey || process.env.PAYPAL_SECRET_KEY || ''
    this.sandbox = config.sandbox ?? !process.env.NODE_ENV?.includes('production')
  }

  private get baseUrl(): string {
    return this.sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'
  }

  async createOrder(request: ChargeRequest): Promise<ChargeResult> {
    if (!this.clientId || !this.secretKey) {
      return { success: false, error: 'PayPal credentials not configured' }
    }

    try {
      const authRes = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secretKey}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      })

      if (!authRes.ok) {
        return { success: false, error: 'PayPal authentication failed' }
      }

      const authData = await authRes.json()
      const orderRes = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: { currency_code: request.currency, value: request.amount.toFixed(2) },
            description: request.description,
          }],
        }),
      })

      if (!orderRes.ok) {
        return { success: false, error: 'Failed to create PayPal order' }
      }

      const orderData = await orderRes.json()
      return { success: true, transactionId: orderData.id, rawResponse: orderData }
    } catch (error) {
      console.error('[PayPal] Create order failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async captureOrder(orderId: string): Promise<ChargeResult> {
    if (!this.clientId || !this.secretKey) {
      return { success: false, error: 'PayPal credentials not configured' }
    }

    try {
      const authRes = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secretKey}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      })

      if (!authRes.ok) {
        return { success: false, error: 'PayPal authentication failed' }
      }

      const authData = await authRes.json()
      const captureRes = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
      })

      if (!captureRes.ok) {
        return { success: false, error: 'Failed to capture PayPal order' }
      }

      const captureData = await captureRes.json()
      const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0]
      return {
        success: true,
        transactionId: capture?.id || orderId,
        rawResponse: captureData,
      }
    } catch (error) {
      console.error('[PayPal] Capture order failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    if (!this.clientId || !this.secretKey) {
      return { success: false, error: 'PayPal credentials not configured' }
    }

    try {
      const authRes = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secretKey}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      })

      if (!authRes.ok) {
        return { success: false, error: 'PayPal authentication failed' }
      }

      const authData = await authRes.json()
      const refundRes = await fetch(`${this.baseUrl}/v2/payments/captures/${request.transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify({
          amount: request.amount ? { value: request.amount.toFixed(2), currency_code: 'USD' } : undefined,
          note_to_payer: request.reason,
        }),
      })

      if (!refundRes.ok) {
        return { success: false, error: 'Failed to process PayPal refund' }
      }

      const refundData = await refundRes.json()
      return { success: true, refundId: refundData.id }
    } catch (error) {
      console.error('[PayPal] Refund failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}

// ============================================================================
// UNIFIED PROCESSOR FACTORY
// ============================================================================

export function createPaymentProcessor(config: ProcessorConfig) {
  switch (config.processor) {
    case 'stripe':
      return new StripeProcessor(config)
    case 'lawpay':
      return new LawPayProcessor(config)
    case 'paypal':
      return new PayPalProcessor(config)
    default:
      throw new Error(`Unknown payment processor: ${config.processor}`)
  }
}

export async function processPayment(
  processor: PaymentProcessor,
  request: ChargeRequest
): Promise<ChargeResult> {
  const config: ProcessorConfig = { processor }
  
  switch (processor) {
    case 'stripe': {
      const stripe = new StripeProcessor(config)
      return stripe.charge(request)
    }
    case 'lawpay': {
      const lawpay = new LawPayProcessor(config)
      return lawpay.charge(request)
    }
    case 'paypal': {
      const paypal = new PayPalProcessor(config)
      return paypal.createOrder(request)
    }
    default:
      return { success: false, error: `Unknown processor: ${processor}` }
  }
}
