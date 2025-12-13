import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { z } from 'zod'

const createPlanSchema = z.object({
  organizationId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  clientId: z.string().uuid(),
  numberOfInstallments: z.number().int().min(2).max(24),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  startDate: z.string().transform((s) => new Date(s)),
  autoCharge: z.boolean().default(false),
  paymentMethodId: z.string().optional(),
  processor: z.enum(['stripe', 'lawpay', 'paypal']).optional(),
})

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
    const invoiceId = searchParams.get('invoiceId')
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const where: Record<string, unknown> = { organizationId }
    if (invoiceId) where.invoiceId = invoiceId
    if (clientId) where.clientId = clientId
    if (status) where.status = status

    const plans = await prisma.paymentPlan.findMany({
      where,
      include: {
        invoice: { select: { invoiceNumber: true, totalAmount: true } },
        client: { select: { displayName: true, email: true } },
        installments: { orderBy: { installmentNumber: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching payment plans:', error)
    return NextResponse.json({ error: 'Failed to fetch payment plans' }, { status: 500 })
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
    const validated = createPlanSchema.parse(body)

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: validated.organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get invoice to determine total amount
    const invoice = await prisma.invoice.findFirst({
      where: { id: validated.invoiceId, organizationId: validated.organizationId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const totalAmount = Number(invoice.balanceDue)
    const installmentAmount = totalAmount / validated.numberOfInstallments

    // Calculate installment due dates
    const installments: Array<{
      installmentNumber: number
      amount: Decimal
      dueDate: Date
    }> = []

    let currentDate = new Date(validated.startDate)
    for (let i = 1; i <= validated.numberOfInstallments; i++) {
      // Last installment gets any rounding difference
      const amount = i === validated.numberOfInstallments
        ? totalAmount - installmentAmount * (validated.numberOfInstallments - 1)
        : installmentAmount

      installments.push({
        installmentNumber: i,
        amount: new Decimal(amount),
        dueDate: new Date(currentDate),
      })

      // Calculate next due date based on frequency
      switch (validated.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14)
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
      }
    }

    const plan = await prisma.paymentPlan.create({
      data: {
        organizationId: validated.organizationId,
        invoiceId: validated.invoiceId,
        clientId: validated.clientId,
        totalAmount: new Decimal(totalAmount),
        numberOfInstallments: validated.numberOfInstallments,
        frequency: validated.frequency,
        startDate: validated.startDate,
        remainingAmount: new Decimal(totalAmount),
        autoCharge: validated.autoCharge,
        paymentMethodId: validated.paymentMethodId,
        processor: validated.processor,
        createdBy: user.id,
        installments: {
          create: installments,
        },
      },
      include: {
        installments: { orderBy: { installmentNumber: 'asc' } },
        invoice: { select: { invoiceNumber: true } },
        client: { select: { displayName: true } },
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating payment plan:', error)
    return NextResponse.json({ error: 'Failed to create payment plan' }, { status: 500 })
  }
}
