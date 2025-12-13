import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { createExpenseJournalEntry, createVendorBillJournalEntry, createVendorPaymentJournalEntry } from './accounting-automation'
import { categorizeExpense, learnFromCorrection } from './ai-financial-service'
import { getExchangeRate } from './exchange-rate-service'
import { getOrganizationMileageRate, calculateMileageAmount } from './mileage-service'

// ============================================================================
// EXPENSE SERVICE
// ============================================================================

export interface CreateExpenseInput {
  organizationId: string
  matterId?: string
  clientId?: string
  userId: string
  vendorId?: string
  category?: string
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
  vendorName?: string
  autoCategorize?: boolean
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
  let appliedMileageRate: number | null = null
  
  if (input.isMileage && input.mileageDistance) {
    // Use provided rate or fetch IRS/organization rate
    if (input.mileageRate) {
      appliedMileageRate = input.mileageRate
    } else {
      const rateInfo = await getOrganizationMileageRate(input.organizationId)
      appliedMileageRate = rateInfo.ratePerMile
    }
    amount = calculateMileageAmount(input.mileageDistance, appliedMileageRate)
  }

  // AI auto-categorization if enabled and category not provided
  let category = input.category
  let subcategory = input.subcategory
  let isBillable = input.isBillable
  let aiCategorizationData: Record<string, unknown> | null = null

  if (input.autoCategorize && !category) {
    try {
      const aiResult = await categorizeExpense(
        input.organizationId,
        input.description,
        input.vendorName,
        amount
      )
      category = aiResult.category
      subcategory = aiResult.subcategory || subcategory
      isBillable = aiResult.isBillable ?? isBillable
      aiCategorizationData = {
        aiCategorized: true,
        confidence: aiResult.confidence,
        suggestedAccountId: aiResult.suggestedAccountId,
        alternativeCategories: aiResult.alternativeCategories,
        categorizedAt: new Date().toISOString(),
      }
    } catch (err) {
      console.warn('AI categorization failed, using default:', err)
      category = 'other'
    }
  }

  // Ensure category has a value
  if (!category) {
    category = 'other'
  }

  // Multi-currency support: compute exchange rate and base currency amount
  const expenseCurrency = input.currency || 'USD'
  const baseCurrency = 'USD' // Organization base currency defaults to USD
  let exchangeRate: number | null = null
  let baseCurrencyAmount: number | null = null

  if (expenseCurrency !== baseCurrency) {
    try {
      exchangeRate = await getExchangeRate(expenseCurrency, baseCurrency)
      baseCurrencyAmount = amount * exchangeRate
    } catch (err) {
      console.warn('Failed to get exchange rate, storing without conversion:', err)
    }
  }

  return prisma.expense.create({
    data: {
      expenseNumber,
      organizationId: input.organizationId,
      matterId: input.matterId,
      clientId: input.clientId,
      userId: input.userId,
      vendorId: input.vendorId,
      category,
      subcategory,
      description: input.description,
      amount: new Decimal(amount),
      currency: expenseCurrency,
      exchangeRate: exchangeRate ? new Decimal(exchangeRate) : null,
      baseCurrencyAmount: baseCurrencyAmount ? new Decimal(baseCurrencyAmount) : null,
      taxAmount: new Decimal(input.taxAmount || 0),
      expenseDate: input.expenseDate,
      isBillable: isBillable ?? true,
      markupPercent: input.markupPercent ? new Decimal(input.markupPercent) : null,
      receiptUrl: input.receiptUrl,
      receiptOcrData: aiCategorizationData ? JSON.stringify(aiCategorizationData) : undefined,
      isMileage: input.isMileage || false,
      mileageDistance: input.mileageDistance ? new Decimal(input.mileageDistance) : null,
      mileageRate: appliedMileageRate ? new Decimal(appliedMileageRate) : (input.mileageRate ? new Decimal(input.mileageRate) : null),
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

  // If category is being changed and expense was AI-categorized, learn from correction
  if (data.category && data.category !== expense.category && expense.receiptOcrData) {
    try {
      const ocrData = JSON.parse(expense.receiptOcrData as string)
      if (ocrData.aiCategorized) {
        await learnFromCorrection(
          organizationId,
          expense.description,
          ocrData.category || expense.category,
          data.category
        )
      }
    } catch (err) {
      console.warn('Failed to learn from category correction:', err)
    }
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

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date(),
    },
  })

  // Create accounting journal entry for approved expense
  try {
    await createExpenseJournalEntry(
      organizationId,
      id,
      expense.category,
      Number(expense.amount),
      expense.paymentMethod || 'other',
      approvedBy
    )
  } catch (err) {
    console.warn('Failed to create expense journal entry:', err)
  }

  return updated
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
  const vendor = await prisma.vendor.findFirst({
    where: { id, organizationId },
  })
  if (!vendor) {
    throw new Error('Vendor not found')
  }
  return prisma.vendor.update({
    where: { id },
    data,
  })
}

export async function deactivateVendor(id: string, organizationId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id, organizationId },
  })
  if (!vendor) {
    throw new Error('Vendor not found')
  }
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
  billNumber?: string
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

export async function generateVendorBillNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.vendorBill.count({
    where: {
      organizationId,
      billNumber: { startsWith: `BILL-${year}-` },
    },
  })
  return `BILL-${year}-${String(count + 1).padStart(4, '0')}`
}

export async function createVendorBill(input: CreateVendorBillInput) {
  const totalAmount = input.subtotal + (input.taxAmount || 0)

  // Auto-generate bill number if not provided
  const billNumber = input.billNumber || await generateVendorBillNumber(input.organizationId)

  const bill = await prisma.$transaction(async (tx) => {
    const newBill = await tx.vendorBill.create({
      data: {
        billNumber,
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

    // Increment vendor totalInvoices on bill creation
    await tx.vendor.update({
      where: { id: input.vendorId },
      data: { totalInvoices: { increment: 1 } },
    })

    return newBill
  })

  // Create accounting journal entry for vendor bill
  try {
    await createVendorBillJournalEntry(
      input.organizationId,
      bill.id,
      input.vendorId,
      totalAmount,
      input.createdBy
    )
  } catch (err) {
    console.warn('Failed to create vendor bill journal entry:', err)
  }

  return bill
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

  const payment = await prisma.$transaction(async (tx) => {
    const pmt = await tx.vendorPayment.create({
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

    // Update vendor metrics - use billDate (not createdAt) for accurate payment days calculation
    const billDate = new Date(bill.billDate)
    const paymentDays = Math.floor((paymentData.paymentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const vendor = await tx.vendor.findUnique({ where: { id: bill.vendorId } })
    const currentAvg = vendor?.avgPaymentDays || 0
    const currentCount = vendor?.totalInvoices || 0
    const newAvg = currentCount > 0 
      ? Math.round((currentAvg * currentCount + paymentDays) / (currentCount + 1))
      : paymentDays

    await tx.vendor.update({
      where: { id: bill.vendorId },
      data: {
        totalPaid: { increment: paymentData.amount },
        avgPaymentDays: newAvg,
      },
    })

    return pmt
  })

  // Create accounting journal entry for vendor payment
  try {
    await createVendorPaymentJournalEntry(
      organizationId,
      payment.id,
      bill.vendorId,
      paymentData.amount,
      paymentData.processedBy
    )
  } catch (err) {
    console.warn('Failed to create vendor payment journal entry:', err)
  }

  return payment
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
): Promise<{ valid: boolean; violations: string[]; requiresApproval: boolean }> {
  const policies = await prisma.expensePolicy.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [{ category }, { category: null }],
    },
  })

  const violations: string[] = []
  let requiresApproval = false

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

    if (policy.requiresApproval) {
      const approvalThreshold = policy.approvalThreshold ? Number(policy.approvalThreshold) : 0
      if (amount >= approvalThreshold) {
        requiresApproval = true
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    requiresApproval,
  }
}

// ============================================================================
// DUPLICATE EXPENSE DETECTION
// ============================================================================

export interface DuplicateCheckResult {
  hasPotentialDuplicates: boolean
  duplicates: Array<{
    id: string
    expenseNumber: string
    description: string
    amount: number
    expenseDate: Date
    similarity: number
  }>
}

export async function checkForDuplicateExpense(
  organizationId: string,
  description: string,
  amount: number,
  expenseDate: Date,
  vendorId?: string,
  excludeExpenseId?: string
): Promise<DuplicateCheckResult> {
  // Look for potential duplicates within a configurable time window
  const windowDays = 7
  const startDate = new Date(expenseDate)
  startDate.setDate(startDate.getDate() - windowDays)
  const endDate = new Date(expenseDate)
  endDate.setDate(endDate.getDate() + windowDays)

  // Amount tolerance: within 5% or $1, whichever is greater
  const amountTolerance = Math.max(amount * 0.05, 1)
  const minAmount = amount - amountTolerance
  const maxAmount = amount + amountTolerance

  const where: Record<string, unknown> = {
    organizationId,
    expenseDate: { gte: startDate, lte: endDate },
    amount: { gte: minAmount, lte: maxAmount },
  }

  if (vendorId) {
    where.vendorId = vendorId
  }

  if (excludeExpenseId) {
    where.id = { not: excludeExpenseId }
  }

  const potentialDuplicates = await prisma.expense.findMany({
    where,
    select: {
      id: true,
      expenseNumber: true,
      description: true,
      amount: true,
      expenseDate: true,
      vendorId: true,
    },
  })

  // Calculate similarity scores
  const duplicates = potentialDuplicates
    .map((expense) => {
      let similarity = 0

      // Amount similarity (up to 40 points)
      const amountDiff = Math.abs(Number(expense.amount) - amount)
      const amountSimilarity = Math.max(0, 40 - (amountDiff / amount) * 100)
      similarity += amountSimilarity

      // Date similarity (up to 30 points)
      const daysDiff = Math.abs(
        (expense.expenseDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const dateSimilarity = Math.max(0, 30 - daysDiff * 5)
      similarity += dateSimilarity

      // Description similarity (up to 30 points)
      const descSimilarity = calculateStringSimilarity(
        description.toLowerCase(),
        expense.description.toLowerCase()
      )
      similarity += descSimilarity * 30

      return {
        id: expense.id,
        expenseNumber: expense.expenseNumber,
        description: expense.description,
        amount: Number(expense.amount),
        expenseDate: expense.expenseDate,
        similarity: Math.round(similarity),
      }
    })
    .filter((d) => d.similarity >= 50) // Only flag if >= 50% similar
    .sort((a, b) => b.similarity - a.similarity)

  return {
    hasPotentialDuplicates: duplicates.length > 0,
    duplicates,
  }
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0

  // Simple word overlap similarity
  const words1 = new Set(str1.split(/\s+/).filter((w) => w.length > 2))
  const words2 = new Set(str2.split(/\s+/).filter((w) => w.length > 2))

  if (words1.size === 0 || words2.size === 0) return 0

  let overlap = 0
  for (const word of words1) {
    if (words2.has(word)) overlap++
  }

  return (2 * overlap) / (words1.size + words2.size)
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

// ============================================================================
// RECEIPT UPLOAD & OCR
// ============================================================================

export interface ReceiptOcrResult {
  vendorName?: string
  amount?: number
  date?: string
  taxAmount?: number
  category?: string
  confidence: number
  [key: string]: string | number | undefined
}

export async function uploadReceipt(
  expenseId: string,
  organizationId: string,
  receiptUrl: string,
  ocrData?: ReceiptOcrResult
) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, organizationId },
  })

  if (!expense) {
    throw new Error('Expense not found')
  }

  return prisma.expense.update({
    where: { id: expenseId },
    data: {
      receiptUrl,
      receiptOcrData: ocrData || {
        message: 'OCR processing pending - requires integration with OCR provider',
        uploadedAt: new Date().toISOString(),
      },
    },
  })
}

export async function processReceiptOcr(
  receiptUrl: string,
  imageBase64?: string
): Promise<ReceiptOcrResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) {
    return {
      vendorName: undefined,
      amount: undefined,
      date: undefined,
      taxAmount: undefined,
      category: undefined,
      confidence: 0,
      provider: 'none',
    }
  }

  // Build image payload: use base64 content for local files, imageUri for remote URLs
  let imagePayload: { content?: string; source?: { imageUri: string } }
  if (imageBase64) {
    imagePayload = { content: imageBase64 }
  } else if (receiptUrl.startsWith('http://') || receiptUrl.startsWith('https://')) {
    imagePayload = { source: { imageUri: receiptUrl } }
  } else {
    // Local path that isn't publicly accessible - cannot use imageUri
    return {
      vendorName: undefined,
      amount: undefined,
      date: undefined,
      taxAmount: undefined,
      category: undefined,
      confidence: 0,
      provider: 'none',
      error: 'local_file_requires_base64',
    }
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: imagePayload,
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    return {
      vendorName: undefined,
      amount: undefined,
      date: undefined,
      taxAmount: undefined,
      category: undefined,
      confidence: 0,
      provider: 'google_vision',
      error: `vision_http_${response.status}`,
    }
  }

  const json = (await response.json()) as any
  const text: string =
    String(
      json?.responses?.[0]?.fullTextAnnotation?.text ||
        json?.responses?.[0]?.textAnnotations?.[0]?.description ||
        ''
    )

  const lines = text
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean)

  const vendorName = lines[0]

  const findMoney = (label: string) => {
    const re = new RegExp(`${label}[^0-9]*([0-9]+(?:\\.[0-9]{2})?)`, 'i')
    const m = text.match(re)
    if (m?.[1]) return parseFloat(m[1])
    return undefined
  }

  const taxAmount = findMoney('tax')

  let amount =
    findMoney('total') ||
    findMoney('amount due') ||
    findMoney('balance due')

  if (amount === undefined) {
    const moneyMatches = Array.from(
      text.matchAll(/\$\s*([0-9]{1,6}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g)
    )
      .map((m: RegExpMatchArray) => parseFloat(String(m[1]).replace(/,/g, '')))
      .filter((n) => Number.isFinite(n))

    if (moneyMatches.length > 0) {
      amount = Math.max(...moneyMatches)
    }
  }

  const dateMatch =
    text.match(/\b(\d{4}-\d{2}-\d{2})\b/) ||
    text.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/) ||
    text.match(/\b(\d{1,2}-\d{1,2}-\d{2,4})\b/)
  const date = dateMatch?.[1]

  let confidence = 0
  if (text) confidence += 0.25
  if (vendorName) confidence += 0.2
  if (amount !== undefined) confidence += 0.3
  if (date) confidence += 0.15
  if (taxAmount !== undefined) confidence += 0.1
  confidence = Math.min(1, confidence)

  return {
    vendorName,
    amount,
    date,
    taxAmount,
    category: undefined,
    confidence,
    provider: 'google_vision',
    rawText: text.slice(0, 5000),
  }
}

// ============================================================================
// BATCH VENDOR BILL PAYMENT
// ============================================================================

export interface BatchPaymentInput {
  billId: string
  amount: number
  paymentMethod: string
  paymentDate: Date
  checkNumber?: string
  referenceNumber?: string
  notes?: string
}

export async function batchPayVendorBills(
  organizationId: string,
  payments: BatchPaymentInput[],
  processedBy: string
) {
  const results: Array<{
    billId: string
    success: boolean
    payment?: unknown
    error?: string
  }> = []

  for (const paymentInput of payments) {
    try {
      const payment = await payVendorBill(
        paymentInput.billId,
        organizationId,
        {
          amount: paymentInput.amount,
          paymentMethod: paymentInput.paymentMethod,
          paymentDate: paymentInput.paymentDate,
          checkNumber: paymentInput.checkNumber,
          referenceNumber: paymentInput.referenceNumber,
          notes: paymentInput.notes,
          processedBy,
        }
      )
      results.push({ billId: paymentInput.billId, success: true, payment })
    } catch (error) {
      results.push({
        billId: paymentInput.billId,
        success: false,
        error: (error as Error).message,
      })
    }
  }

  return {
    total: payments.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    totalAmount: payments
      .filter((_, i) => results[i].success)
      .reduce((sum, p) => sum + p.amount, 0),
    results,
  }
}

// ============================================================================
// EXPENSE POLICY UPDATE
// ============================================================================

export async function updateExpensePolicy(
  id: string,
  organizationId: string,
  data: Partial<{
    policyName: string
    category: string
    maxAmount: number
    requiresApproval: boolean
    approvalThreshold: number
    requiresReceipt: boolean
    receiptThreshold: number
    isActive: boolean
  }>
) {
  const policy = await prisma.expensePolicy.findFirst({
    where: { id, organizationId },
  })

  if (!policy) {
    throw new Error('Expense policy not found')
  }

  return prisma.expensePolicy.update({
    where: { id },
    data: {
      policyName: data.policyName,
      category: data.category,
      maxAmount: data.maxAmount !== undefined ? new Decimal(data.maxAmount) : undefined,
      requiresApproval: data.requiresApproval,
      approvalThreshold: data.approvalThreshold !== undefined ? new Decimal(data.approvalThreshold) : undefined,
      requiresReceipt: data.requiresReceipt,
      receiptThreshold: data.receiptThreshold !== undefined ? new Decimal(data.receiptThreshold) : undefined,
      isActive: data.isActive,
    },
  })
}

