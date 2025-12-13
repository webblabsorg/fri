import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// VENDOR CREDIT SERVICE
// ============================================================================

export interface CreateVendorCreditInput {
  organizationId: string
  vendorId: string
  amount: number
  currency?: string
  reason?: string
  description?: string
  creditDate: Date
  expirationDate?: Date
  createdBy: string
}

export async function generateCreditNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.vendorCredit.count({
    where: {
      organizationId,
      creditNumber: { startsWith: `CR-${year}-` },
    },
  })
  return `CR-${year}-${String(count + 1).padStart(4, '0')}`
}

export async function createVendorCredit(input: CreateVendorCreditInput) {
  const creditNumber = await generateCreditNumber(input.organizationId)

  return prisma.vendorCredit.create({
    data: {
      creditNumber,
      organizationId: input.organizationId,
      vendorId: input.vendorId,
      amount: new Decimal(input.amount),
      remainingAmount: new Decimal(input.amount),
      currency: input.currency || 'USD',
      reason: input.reason,
      description: input.description,
      creditDate: input.creditDate,
      expirationDate: input.expirationDate,
      status: 'active',
      createdBy: input.createdBy,
    },
    include: {
      vendor: true,
    },
  })
}

export async function getVendorCredits(
  organizationId: string,
  options?: {
    vendorId?: string
    status?: string
    limit?: number
    offset?: number
  }
) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.vendorId) {
    where.vendorId = options.vendorId
  }
  if (options?.status) {
    where.status = options.status
  }

  const [credits, total] = await Promise.all([
    prisma.vendorCredit.findMany({
      where,
      include: {
        vendor: {
          select: { id: true, name: true, vendorNumber: true },
        },
        applications: {
          include: {
            bill: {
              select: { id: true, billNumber: true },
            },
          },
        },
      },
      orderBy: { creditDate: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.vendorCredit.count({ where }),
  ])

  return { credits, total }
}

export async function getVendorCreditById(id: string, organizationId: string) {
  return prisma.vendorCredit.findFirst({
    where: { id, organizationId },
    include: {
      vendor: true,
      applications: {
        include: {
          bill: {
            select: { id: true, billNumber: true, totalAmount: true },
          },
        },
      },
    },
  })
}

export async function getAvailableCreditsForVendor(organizationId: string, vendorId: string) {
  return prisma.vendorCredit.findMany({
    where: {
      organizationId,
      vendorId,
      status: { in: ['active', 'partially_applied'] },
      remainingAmount: { gt: 0 },
      OR: [
        { expirationDate: null },
        { expirationDate: { gte: new Date() } },
      ],
    },
    orderBy: { creditDate: 'asc' },
  })
}

export interface ApplyCreditInput {
  creditId: string
  billId: string
  amount: number
  appliedBy: string
  notes?: string
}

export async function applyVendorCredit(
  organizationId: string,
  input: ApplyCreditInput
) {
  const credit = await prisma.vendorCredit.findFirst({
    where: {
      id: input.creditId,
      organizationId,
      status: { in: ['active', 'partially_applied'] },
    },
  })

  if (!credit) {
    throw new Error('Credit not found or not available')
  }

  if (Number(credit.remainingAmount) < input.amount) {
    throw new Error(`Insufficient credit balance. Available: ${credit.remainingAmount}`)
  }

  const bill = await prisma.vendorBill.findFirst({
    where: {
      id: input.billId,
      organizationId,
      vendorId: credit.vendorId,
    },
  })

  if (!bill) {
    throw new Error('Bill not found or vendor mismatch')
  }

  if (Number(bill.balanceDue) < input.amount) {
    throw new Error(`Amount exceeds bill balance due. Balance: ${bill.balanceDue}`)
  }

  return prisma.$transaction(async (tx) => {
    // Create application record
    const application = await tx.vendorCreditApplication.create({
      data: {
        organizationId,
        creditId: input.creditId,
        billId: input.billId,
        amount: new Decimal(input.amount),
        appliedBy: input.appliedBy,
        notes: input.notes,
      },
    })

    // Update credit remaining amount
    const newRemainingAmount = Number(credit.remainingAmount) - input.amount
    const newCreditStatus = newRemainingAmount <= 0 ? 'fully_applied' : 'partially_applied'

    await tx.vendorCredit.update({
      where: { id: input.creditId },
      data: {
        remainingAmount: new Decimal(newRemainingAmount),
        status: newCreditStatus,
      },
    })

    // Update bill balance due
    const newBalanceDue = Number(bill.balanceDue) - input.amount
    const newPaidAmount = Number(bill.paidAmount) + input.amount

    await tx.vendorBill.update({
      where: { id: input.billId },
      data: {
        balanceDue: new Decimal(Math.max(0, newBalanceDue)),
        paidAmount: new Decimal(newPaidAmount),
        status: newBalanceDue <= 0 ? 'paid' : bill.status,
        paidAt: newBalanceDue <= 0 ? new Date() : bill.paidAt,
      },
    })

    return application
  })
}

export async function cancelVendorCredit(id: string, organizationId: string) {
  const credit = await prisma.vendorCredit.findFirst({
    where: { id, organizationId },
    include: { applications: true },
  })

  if (!credit) {
    throw new Error('Credit not found')
  }

  if (credit.applications.length > 0) {
    throw new Error('Cannot cancel credit that has been applied to bills')
  }

  return prisma.vendorCredit.update({
    where: { id },
    data: { status: 'cancelled' },
  })
}
