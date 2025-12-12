import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createPayment, getPayments } from '@/lib/finance/billing-service'

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

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const clientId = searchParams.get('clientId') || undefined
    const invoiceId = searchParams.get('invoiceId') || undefined
    const status = searchParams.get('status') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await getPayments(organizationId, {
      clientId,
      invoiceId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
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
    const {
      organizationId,
      invoiceId,
      clientId,
      amount,
      currency,
      paymentMethod,
      paymentDate,
      processorId,
      processorFee,
      checkNumber,
      bankName,
      trustTransactionId,
      referenceNumber,
      notes,
    } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!clientId || !amount || !paymentMethod || !paymentDate) {
      return NextResponse.json(
        { error: 'Client, amount, payment method, and payment date are required' },
        { status: 400 }
      )
    }

    const payment = await createPayment({
      organizationId,
      invoiceId,
      clientId,
      amount,
      currency,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      processorId,
      processorFee,
      checkNumber,
      bankName,
      trustTransactionId,
      referenceNumber,
      notes,
      processedBy: user.id,
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
