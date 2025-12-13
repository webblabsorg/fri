import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  getPaymentProcessor,
  getSupportedProcessors,
  recordProcessorPayment,
  PaymentProcessor,
} from '@/lib/finance/payment-processors'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return supported processors
    const processors = getSupportedProcessors()
    return NextResponse.json({ processors })
  } catch (error) {
    console.error('Error fetching payment processors:', error)
    return NextResponse.json({ error: 'Failed to fetch processors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, processor, invoiceId, amount, currency, paymentIntentId, paymentMethodId, transactionId, refundAmount, refundReason } = body

    const validProcessors: PaymentProcessor[] = ['stripe', 'lawpay', 'paypal']
    if (!validProcessors.includes(processor)) {
      return NextResponse.json(
        { error: `Invalid processor. Must be one of: ${validProcessors.join(', ')}` },
        { status: 400 }
      )
    }

    const paymentProcessor = getPaymentProcessor(processor)

    // Create payment intent
    if (action === 'create_intent') {
      if (!invoiceId || !amount) {
        return NextResponse.json(
          { error: 'Invoice ID and amount are required' },
          { status: 400 }
        )
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { client: true, organization: true },
      })

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      // Verify user has access
      const member = await prisma.organizationMember.findFirst({
        where: { organizationId: invoice.organizationId, userId: user.id, status: 'active' },
      })

      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const result = await paymentProcessor.createPaymentIntent({
        processor,
        amount: parseFloat(amount),
        currency: currency || invoice.currency || 'USD',
        invoiceId,
        clientId: invoice.clientId,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        metadata: {
          organizationId: invoice.organizationId,
          clientName: invoice.client.displayName,
        },
      })

      return NextResponse.json({ paymentIntent: result })
    }

    // Process/capture payment
    if (action === 'process') {
      if (!paymentIntentId) {
        return NextResponse.json(
          { error: 'Payment intent ID is required' },
          { status: 400 }
        )
      }

      const result = await paymentProcessor.processPayment({
        processor,
        paymentIntentId,
        paymentMethodId,
      })

      // If successful, record the payment
      if (result.success && invoiceId && result.transactionId) {
        await recordProcessorPayment(
          invoiceId,
          processor,
          result.transactionId,
          amount || 0,
          user.id
        )
      }

      return NextResponse.json({ payment: result })
    }

    // Process refund
    if (action === 'refund') {
      if (!transactionId) {
        return NextResponse.json(
          { error: 'Transaction ID is required for refund' },
          { status: 400 }
        )
      }

      const result = await paymentProcessor.refund({
        processor,
        transactionId,
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason,
      })

      return NextResponse.json({ refund: result })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "create_intent", "process", or "refund"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    )
  }
}
