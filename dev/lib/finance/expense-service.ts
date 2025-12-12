import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// EXPENSE SERVICE
// ============================================================================

export interface CreateExpenseInput {
  organizationId: string
  matterId?: string
  clientId?: string
  userId: string
  vendorId?: string
  category: string
  subcategory?: string
  description: string
  amount: number
  currency?: string
  taxAmount?: number
  expenseDate: Date
  isBillable?: boolean
  markupPercent?: number
  receiptUrl?: string
  isMileage?: boolean
  mileageDistance?: number
  mileageRate?: number
  mileageStart?: string
  mileageEnd?: string
  paymentMethod?: string
}

export async function generateExpenseNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.expense.count({
    where: {
      organizationId,
      expenseNumber: { startsWith: `EXP-${year}-` },
    },
  })
  return `EXP-${year}-${String(count + 1).padStart(4, '0')}`
}

export async function createExpense(input: CreateExpenseInput) {
  const expenseNumber = await generateExpenseNumber(input.organizationId)

  let amount = input.amount
  if (input.isMileage && input.mileageDistance && input.mileageRate) {
    amount = input.mileageDistance * input.mileageRate
  }

  return prisma.expense.create({
    data: {
      expenseNumber,
      organizationId: input.organizationId,
      matterId: input.matterId,
      clientId: input.clientId,
      userId: input.userId,
      vendorId: input.vendorId,
      category: input.category,
      subcategory: input.subcategory,
      description: input.description,
      amount: new Decimal(amount),
      currency: input.currency || 'USD',
      taxAmount: new Decimal(input.taxAmount || 0),
      expenseDate: input.expenseDate,
      isBillable: input.isBillable ?? true,
      markupPercent: input.markupPercent ? new Decimal(input.markupPercent) : null,
      receiptUrl: input.receiptUrl,
      isMileage: input.isMileage || false,
      mileageDistance: input.mileageDistance ? new Decimal(input.mileageDistance) : null,
      mileageRate: input.mileageRate ? new Decimal(input.mileageRate) : null,
      mileageStart: input.mileageStart,
      mileageEnd: input.mileageEnd,
      paymentMethod: input.paymentMethod,
      status: 'draft',
      approvalStatus: 'pending',
    },
    include: {
      matter: true,
      client: true,
      vendor: true,
    },
  })
}

export async function getExpenses(organizationId: string, options?: {
  userId?: string
  matterId?: string
  clientId?: string
  category?: string
  status?: string
  isBillable?: boolean
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.userId) {
    where.userId = options.userId
  }
  if (options?.matterId) {
    where.matterId = options.matterId
  }
  if (options?.clientId) {
    where.clientId = options.clientId
  }
  if (options?.category) {
    where.category = options.category
  }
  if (options?.status) {
    where.status = options.status
  }
  if (options?.isBillable !== undefined) {
    where.isBillable = options.isBillable
  }
  if (options?.startDate || options?.endDate) {
    where.expenseDate = {}
    if (options?.startDate) {
      (where.expenseDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.expenseDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        matter: true,
        client: true,
        vendor: true,
      },
      orderBy: { expenseDate: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.expense.count({ where }),
  ])

  return { expenses, total }
}

export async function getExpenseById(id: string, organizationId: string) {
  return prisma.expense.findFirst({
    where: { id, organizationId },
    include: {
      matter: { include: { client: true } },
      client: true,
      vendor: true,
      invoiceLineItem: true,
    },
  })
}

export async function updateExpense(
  id: string,
  organizationId: string,
  data: Partial<CreateExpenseInput>
) {
  const expense = await prisma.expense.findFirst({
    where: { id, organizationId, status: 'draft' },
  })

  if (!expense) {
    throw new Error('Expense not found or cannot be edited')
  }

  return prisma.expense.update({
    where: { id },
    data: {
      matterId: data.matterId,
      clientId: data.clientId,
      vendorId: data.vendorId,
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      amount: data.amount ? new Decimal(data.amount) : undefined,
      taxAmount: data.taxAmount !== undefined ? new Decimal(data.taxAmount) : undefined,
      expenseDate: data.expenseDate,
      isBillable: data.isBillable,
      markupPercent: data.markupPercent ? new Decimal(data.markupPercent) : undefined,
      receiptUrl: data.receiptUrl,
      paymentMethod: data.paymentMethod,
    },
    include: { matter: true, client: true, vendor: true },
  })
}

export async function deleteExpense(id: string, organizationId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, organizationId, status: 'draft' },
  })

  if (!expense) {
    throw new Error('Expense not found or cannot be deleted')
  }

  return prisma.expense.delete({ where: { id } })
}

export async function submitExpense(id: string, organizationId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, organizationId, status: 'draft' },
  })

  if (!expense) {
    throw new Error('Expense not found or already submitted')
  }

  return prisma.expense.update({
    where: { id },
    data: {
      status: 'submitted',
      submittedAt: new Date(),
    },
  })
}

export async function approveExpense(id: string, organizationId: string, approvedBy: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, organizationId, status: { in: ['submitted', 'pending_approval'] } },
  })

  if (!expense) {
    throw new Error('Expense not found or cannot be approved')
  }

  return prisma.expense.update({
    where: { id },
    data: {
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date(),
    },
  })
}

export async function rejectExpense(
  id: string,
  organizationId: string,
  rejectedBy: string,
  reason: string
) {
  const expense = await prisma.expense.findFirst({
    where: { id, organizationId, status: { in: ['submitted', 'pending_approval'] } },
  })

  if (!expense) {
    throw new Error('Expense not found or cannot be rejected')
  }

  return prisma.expense.update({
    where: { id },
    data: {
      status: 'rejected',
      approvalStatus: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
    },
  })
}

// ============================================================================
// VENDOR SERVICE
// ============================================================================

export interface CreateVendorInput {
  organizationId: string
  name: string
  vendorType: string
  email?: string
  phone?: string
  website?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  taxId?: string
  taxIdType?: string
  is1099Eligible?: boolean
  paymentTerms?: string
  preferredPaymentMethod?: string
  isPreferred?: boolean
  notes?: string
}

export async function generateVendorNumber(organizationId: string): Promise<string> {
  const count = await prisma.vendor.count({ where: { organizationId } })
  return `VEN-${String(count + 1).padStart(4, '0')}`
}

export async function createVendor(input: CreateVendorInput) {
  const vendorNumber = await generateVendorNumber(input.organizationId)

  return prisma.vendor.create({
    data: {
      vendorNumber,
      organizationId: input.organizationId,
      name: input.name,
      vendorType: input.vendorType,
      email: input.email,
      phone: input.phone,
      website: input.website,
      address1: input.address1,
      address2: input.address2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country || 'US',
      taxId: input.taxId,
      taxIdType: input.taxIdType,
      is1099Eligible: input.is1099Eligible || false,
      paymentTerms: input.paymentTerms,
      preferredPaymentMethod: input.preferredPaymentMethod,
      isPreferred: input.isPreferred || false,
      notes: input.notes,
      isActive: true,
    },
  })
}

export async function getVendors(organizationId: string, options?: {
  vendorType?: string
  isActive?: boolean
  isPreferred?: boolean
  search?: string
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.vendorType) {
    where.vendorType = options.vendorType
  }
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive
  }
  if (options?.isPreferred !== undefined) {
    where.isPreferred = options.isPreferred
  }
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { email: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        _count: { select: { expenses: true, bills: true } },
      },
      orderBy: { name: 'asc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.vendor.count({ where }),
  ])

  return { vendors, total }
}

export async function getVendorById(id: string, organizationId: string) {
  return prisma.vendor.findFirst({
    where: { id, organizationId },
    include: {
      expenses: { take: 10, orderBy: { expenseDate: 'desc' } },
      bills: { take: 10, orderBy: { billDate: 'desc' } },
      _count: { select: { expenses: true, bills: true, payments: true } },
    },
  })
}

export async function updateVendor(
  id: string,
  organizationId: string,
  data: Partial<CreateVendorInput>
) {
  return prisma.vendor.update({
    where: { id },
    data,
  })
}

export async function deactivateVendor(id: string, organizationId: string) {
  return prisma.vendor.update({
    where: { id },
    data: { isActive: false },
  })
}

// ============================================================================
// VENDOR BILL SERVICE
// ============================================================================

export interface CreateVendorBillInput {
  organizationId: string
  vendorId: string
  matterId?: string
  billNumber: string
  subtotal: number
  taxAmount?: number
  billDate: Date
  dueDate: Date
  documentUrl?: string
  notes?: string
  createdBy: string
  lineItems: {
    description: string
    quantity?: number
    unitPrice: number
    accountId?: string
    matterId?: string
    isBillable?: boolean
  }[]
}

export async function createVendorBill(input: CreateVendorBillInput) {
  const totalAmount = input.subtotal + (input.taxAmount || 0)

  return prisma.vendorBill.create({
    data: {
      billNumber: input.billNumber,
      organizationId: input.organizationId,
      vendorId: input.vendorId,
      matterId: input.matterId,
      subtotal: new Decimal(input.subtotal),
      taxAmount: new Decimal(input.taxAmount || 0),
      totalAmount: new Decimal(totalAmount),
      balanceDue: new Decimal(totalAmount),
      billDate: input.billDate,
      dueDate: input.dueDate,
      documentUrl: input.documentUrl,
      notes: input.notes,
      status: 'pending',
      approvalStatus: 'pending',
      createdBy: input.createdBy,
      lineItems: {
        create: input.lineItems.map((item) => ({
          description: item.description,
          quantity: new Decimal(item.quantity || 1),
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal((item.quantity || 1) * item.unitPrice),
          accountId: item.accountId,
          matterId: item.matterId,
          isBillable: item.isBillable || false,
        })),
      },
    },
    include: {
      vendor: true,
      matter: true,
      lineItems: true,
    },
  })
}

export async function getVendorBills(organizationId: string, options?: {
  vendorId?: string
  matterId?: string
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.vendorId) {
    where.vendorId = options.vendorId
  }
  if (options?.matterId) {
    where.matterId = options.matterId
  }
  if (options?.status) {
    where.status = options.status
  }
  if (options?.startDate || options?.endDate) {
    where.billDate = {}
    if (options?.startDate) {
      (where.billDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.billDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [bills, total] = await Promise.all([
    prisma.vendorBill.findMany({
      where,
      include: {
        vendor: true,
        matter: true,
        _count: { select: { lineItems: true, payments: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.vendorBill.count({ where }),
  ])

  return { bills, total }
}

export async function getVendorBillById(id: string, organizationId: string) {
  return prisma.vendorBill.findFirst({
    where: { id, organizationId },
    include: {
      vendor: true,
      matter: true,
      lineItems: true,
      payments: true,
    },
  })
}

export async function approveVendorBill(id: string, organizationId: string, approvedBy: string) {
  const bill = await prisma.vendorBill.findFirst({
    where: { id, organizationId, status: 'pending' },
  })

  if (!bill) {
    throw new Error('Bill not found or already approved')
  }

  return prisma.vendorBill.update({
    where: { id },
    data: {
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date(),
    },
  })
}

export async function payVendorBill(
  id: string,
  organizationId: string,
  paymentData: {
    amount: number
    paymentMethod: string
    paymentDate: Date
    checkNumber?: string
    referenceNumber?: string
    notes?: string
    processedBy: string
  }
) {
  const bill = await prisma.vendorBill.findFirst({
    where: { id, organizationId, status: { in: ['approved', 'scheduled'] } },
  })

  if (!bill) {
    throw new Error('Bill not found or not approved')
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.vendorPayment.create({
      data: {
        organizationId,
        vendorId: bill.vendorId,
        billId: id,
        amount: new Decimal(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        checkNumber: paymentData.checkNumber,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        status: 'completed',
        processedBy: paymentData.processedBy,
      },
    })

    const newPaidAmount = Number(bill.paidAmount) + paymentData.amount
    const newBalanceDue = Number(bill.totalAmount) - newPaidAmount

    await tx.vendorBill.update({
      where: { id },
      data: {
        paidAmount: new Decimal(newPaidAmount),
        balanceDue: new Decimal(Math.max(0, newBalanceDue)),
        status: newBalanceDue <= 0 ? 'paid' : bill.status,
        paidAt: newBalanceDue <= 0 ? new Date() : null,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.referenceNumber,
      },
    })

    await tx.vendor.update({
      where: { id: bill.vendorId },
      data: {
        totalPaid: { increment: paymentData.amount },
        totalInvoices: { increment: 1 },
      },
    })

    return payment
  })
}

// ============================================================================
// EXPENSE POLICY SERVICE
// ============================================================================

export interface CreateExpensePolicyInput {
  organizationId: string
  policyName: string
  category?: string
  maxAmount?: number
  requiresApproval?: boolean
  approvalThreshold?: number
  requiresReceipt?: boolean
  receiptThreshold?: number
}

export async function createExpensePolicy(input: CreateExpensePolicyInput) {
  return prisma.expensePolicy.create({
    data: {
      organizationId: input.organizationId,
      policyName: input.policyName,
      category: input.category,
      maxAmount: input.maxAmount ? new Decimal(input.maxAmount) : null,
      requiresApproval: input.requiresApproval || false,
      approvalThreshold: input.approvalThreshold ? new Decimal(input.approvalThreshold) : null,
      requiresReceipt: input.requiresReceipt ?? true,
      receiptThreshold: input.receiptThreshold ? new Decimal(input.receiptThreshold) : null,
      isActive: true,
    },
  })
}

export async function getExpensePolicies(organizationId: string) {
  return prisma.expensePolicy.findMany({
    where: { organizationId, isActive: true },
    orderBy: { policyName: 'asc' },
  })
}

export async function checkExpensePolicy(
  organizationId: string,
  category: string,
  amount: number,
  hasReceipt: boolean
): Promise<{ valid: boolean; violations: string[] }> {
  const policies = await prisma.expensePolicy.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [{ category }, { category: null }],
    },
  })

  const violations: string[] = []

  for (const policy of policies) {
    if (policy.maxAmount && amount > Number(policy.maxAmount)) {
      violations.push(`Exceeds maximum amount of $${policy.maxAmount} for ${policy.policyName}`)
    }

    if (policy.requiresReceipt && !hasReceipt) {
      const threshold = policy.receiptThreshold ? Number(policy.receiptThreshold) : 0
      if (amount >= threshold) {
        violations.push(`Receipt required for expenses over $${threshold}`)
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}

// ============================================================================
// EXPENSE REPORTS
// ============================================================================

export async function getExpensesByCategory(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      expenseDate: { gte: startDate, lte: endDate },
      status: { in: ['approved', 'paid'] },
    },
  })

  const byCategory: Record<string, { count: number; total: number }> = {}

  for (const expense of expenses) {
    if (!byCategory[expense.category]) {
      byCategory[expense.category] = { count: 0, total: 0 }
    }
    byCategory[expense.category].count++
    byCategory[expense.category].total += Number(expense.amount)
  }

  return {
    periodStart: startDate,
    periodEnd: endDate,
    totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    expenseCount: expenses.length,
    byCategory: Object.entries(byCategory)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total),
  }
}

export async function getExpensesByMatter(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      expenseDate: { gte: startDate, lte: endDate },
      status: { in: ['approved', 'paid'] },
      matterId: { not: null },
    },
    include: { matter: { include: { client: true } } },
  })

  const byMatter: Record<string, {
    matterId: string
    matterName: string
    clientName: string
    count: number
    total: number
    billable: number
    nonBillable: number
  }> = {}

  for (const expense of expenses) {
    if (!expense.matterId || !expense.matter) continue

    if (!byMatter[expense.matterId]) {
      byMatter[expense.matterId] = {
        matterId: expense.matterId,
        matterName: expense.matter.name,
        clientName: expense.matter.client.displayName,
        count: 0,
        total: 0,
        billable: 0,
        nonBillable: 0,
      }
    }

    const amount = Number(expense.amount)
    byMatter[expense.matterId].count++
    byMatter[expense.matterId].total += amount
    if (expense.isBillable) {
      byMatter[expense.matterId].billable += amount
    } else {
      byMatter[expense.matterId].nonBillable += amount
    }
  }

  return {
    periodStart: startDate,
    periodEnd: endDate,
    byMatter: Object.values(byMatter).sort((a, b) => b.total - a.total),
  }
}

export async function getReimbursableExpenses(organizationId: string, userId?: string) {
  const where: Record<string, unknown> = {
    organizationId,
    paymentMethod: 'personal',
    reimbursed: false,
    status: 'approved',
  }

  if (userId) {
    where.userId = userId
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { matter: true },
    orderBy: { expenseDate: 'desc' },
  })

  const byUser: Record<string, { userId: string; total: number; expenses: typeof expenses }> = {}

  for (const expense of expenses) {
    if (!byUser[expense.userId]) {
      byUser[expense.userId] = { userId: expense.userId, total: 0, expenses: [] }
    }
    byUser[expense.userId].total += Number(expense.amount)
    byUser[expense.userId].expenses.push(expense)
  }

  return {
    totalReimbursable: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    expenseCount: expenses.length,
    byUser: Object.values(byUser),
  }
}

export async function get1099Report(organizationId: string, taxYear: number) {
  const startDate = new Date(taxYear, 0, 1)
  const endDate = new Date(taxYear, 11, 31, 23, 59, 59)

  const vendors = await prisma.vendor.findMany({
    where: {
      organizationId,
      is1099Eligible: true,
      isActive: true,
    },
    include: {
      payments: {
        where: {
          paymentDate: { gte: startDate, lte: endDate },
          status: 'completed',
        },
      },
    },
  })

  const report = vendors
    .map((vendor) => ({
      vendorId: vendor.id,
      vendorNumber: vendor.vendorNumber,
      vendorName: vendor.name,
      taxId: vendor.taxId ? '***-**-' + vendor.taxId.slice(-4) : 'Not provided',
      taxIdType: vendor.taxIdType,
      totalPaid: vendor.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      paymentCount: vendor.payments.length,
    }))
    .filter((v) => v.totalPaid >= 600)
    .sort((a, b) => b.totalPaid - a.totalPaid)

  return {
    taxYear,
    threshold: 600,
    vendors: report,
    totalVendors: report.length,
    totalPayments: report.reduce((sum, v) => sum + v.totalPaid, 0),
  }
}

// Current IRS mileage rate (2024)
export const CURRENT_MILEAGE_RATE = 0.67
