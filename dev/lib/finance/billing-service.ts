import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// INVOICE SERVICE
// ============================================================================

export interface CreateInvoiceInput {
  organizationId: string
  clientId: string
  matterId?: string
  billingType: 'hourly' | 'fixed_fee' | 'contingency' | 'hybrid'
  issueDate: Date
  dueDate: Date
  paymentTerms?: string
  currency?: string
  notes?: string
  internalNotes?: string
  termsAndConditions?: string
  ledesFormat?: boolean
  ledesVersion?: string
  createdBy: string
}

export interface InvoiceLineItemInput {
  itemType: 'time_entry' | 'expense' | 'fixed_fee' | 'adjustment' | 'credit'
  description: string
  quantity: number
  rate: number
  utbmsTaskCode?: string
  utbmsActivityCode?: string
  utbmsExpenseCode?: string
  timeEntryId?: string
  expenseId?: string
  taxable?: boolean
  taxRate?: number
  serviceDate?: Date
  serviceDateEnd?: Date
}

export async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.invoice.count({
    where: {
      organizationId,
      invoiceNumber: { startsWith: `INV-${year}-` },
    },
  })
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`
}

export async function createInvoice(
  input: CreateInvoiceInput,
  lineItems: InvoiceLineItemInput[]
) {
  const invoiceNumber = await generateInvoiceNumber(input.organizationId)

  let subtotal = 0
  let totalTax = 0

  const processedLineItems = lineItems.map((item, index) => {
    const amount = item.quantity * item.rate
    const taxAmount = item.taxable && item.taxRate ? amount * item.taxRate : 0
    subtotal += amount
    totalTax += taxAmount

    return {
      lineNumber: index + 1,
      itemType: item.itemType,
      description: item.description,
      quantity: new Decimal(item.quantity),
      rate: new Decimal(item.rate),
      amount: new Decimal(amount),
      utbmsTaskCode: item.utbmsTaskCode,
      utbmsActivityCode: item.utbmsActivityCode,
      utbmsExpenseCode: item.utbmsExpenseCode,
      timeEntryId: item.timeEntryId,
      expenseId: item.expenseId,
      taxable: item.taxable || false,
      taxRate: item.taxRate ? new Decimal(item.taxRate) : null,
      taxAmount: new Decimal(taxAmount),
      serviceDate: item.serviceDate,
      serviceDateEnd: item.serviceDateEnd,
    }
  })

  const totalAmount = subtotal + totalTax

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      organizationId: input.organizationId,
      clientId: input.clientId,
      matterId: input.matterId,
      billingType: input.billingType,
      status: 'draft',
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      paymentTerms: input.paymentTerms,
      subtotal: new Decimal(subtotal),
      taxAmount: new Decimal(totalTax),
      totalAmount: new Decimal(totalAmount),
      balanceDue: new Decimal(totalAmount),
      currency: input.currency || 'USD',
      notes: input.notes,
      internalNotes: input.internalNotes,
      termsAndConditions: input.termsAndConditions,
      ledesFormat: input.ledesFormat || false,
      ledesVersion: input.ledesVersion,
      createdBy: input.createdBy,
      lineItems: {
        create: processedLineItems,
      },
    },
    include: {
      lineItems: true,
      client: true,
      matter: true,
    },
  })

  return invoice
}

export async function getInvoices(organizationId: string, options?: {
  clientId?: string
  matterId?: string
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.clientId) {
    where.clientId = options.clientId
  }
  if (options?.matterId) {
    where.matterId = options.matterId
  }
  if (options?.status) {
    where.status = options.status
  }
  if (options?.startDate || options?.endDate) {
    where.issueDate = {}
    if (options?.startDate) {
      (where.issueDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.issueDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        client: true,
        matter: true,
        _count: { select: { lineItems: true, payments: true } },
      },
      orderBy: { issueDate: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.invoice.count({ where }),
  ])

  return { invoices, total }
}

export async function getInvoiceById(id: string, organizationId: string) {
  return prisma.invoice.findFirst({
    where: { id, organizationId },
    include: {
      client: true,
      matter: true,
      lineItems: {
        orderBy: { lineNumber: 'asc' },
        include: { timeEntry: true, expense: true },
      },
      payments: { orderBy: { paymentDate: 'desc' } },
      reminders: { orderBy: { scheduledFor: 'desc' } },
    },
  })
}

export async function updateInvoice(
  id: string,
  organizationId: string,
  data: Partial<CreateInvoiceInput>
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId, status: 'draft' },
  })

  if (!invoice) {
    throw new Error('Invoice not found or cannot be edited')
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      dueDate: data.dueDate,
      paymentTerms: data.paymentTerms,
      notes: data.notes,
      internalNotes: data.internalNotes,
      termsAndConditions: data.termsAndConditions,
    },
    include: { client: true, matter: true, lineItems: true },
  })
}

export async function deleteInvoice(id: string, organizationId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId, status: 'draft' },
  })

  if (!invoice) {
    throw new Error('Invoice not found or cannot be deleted')
  }

  return prisma.invoice.delete({ where: { id } })
}

export async function approveInvoice(id: string, organizationId: string, approvedBy: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId, status: { in: ['draft', 'pending_approval'] } },
  })

  if (!invoice) {
    throw new Error('Invoice not found or already approved')
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    },
  })
}

export async function sendInvoice(id: string, organizationId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId, status: 'approved' },
  })

  if (!invoice) {
    throw new Error('Invoice not found or not approved')
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      status: 'sent',
      sentAt: new Date(),
    },
  })
}

export async function markInvoiceViewed(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } })

  if (!invoice || invoice.viewedAt) {
    return invoice
  }

  return prisma.invoice.update({
    where: { id },
    data: { viewedAt: new Date() },
  })
}

export async function writeOffInvoice(
  id: string,
  organizationId: string,
  writeOffAmount: number,
  reason?: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const newWriteOff = Number(invoice.writeOffAmount) + writeOffAmount
  const newBalanceDue = Number(invoice.balanceDue) - writeOffAmount

  return prisma.invoice.update({
    where: { id },
    data: {
      writeOffAmount: new Decimal(newWriteOff),
      balanceDue: new Decimal(Math.max(0, newBalanceDue)),
      status: newBalanceDue <= 0 ? 'written_off' : invoice.status,
      internalNotes: reason
        ? `${invoice.internalNotes || ''}\nWrite-off: $${writeOffAmount} - ${reason}`
        : invoice.internalNotes,
    },
  })
}

// ============================================================================
// PAYMENT SERVICE
// ============================================================================

export interface CreatePaymentInput {
  organizationId: string
  invoiceId?: string
  clientId: string
  amount: number
  currency?: string
  paymentMethod: string
  paymentDate: Date
  processorId?: string
  processorFee?: number
  checkNumber?: string
  bankName?: string
  trustTransactionId?: string
  referenceNumber?: string
  notes?: string
  processedBy: string
}

export async function createPayment(input: CreatePaymentInput) {
  const netAmount = input.processorFee
    ? input.amount - input.processorFee
    : input.amount

  const payment = await prisma.$transaction(async (tx) => {
    const pmt = await tx.payment.create({
      data: {
        organizationId: input.organizationId,
        invoiceId: input.invoiceId,
        clientId: input.clientId,
        amount: new Decimal(input.amount),
        currency: input.currency || 'USD',
        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate,
        processorId: input.processorId,
        processorFee: input.processorFee ? new Decimal(input.processorFee) : null,
        netAmount: new Decimal(netAmount),
        checkNumber: input.checkNumber,
        bankName: input.bankName,
        trustTransactionId: input.trustTransactionId,
        referenceNumber: input.referenceNumber,
        notes: input.notes,
        status: 'completed',
        processedBy: input.processedBy,
      },
    })

    if (input.invoiceId) {
      const invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
      })

      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + input.amount
        const newBalanceDue = Number(invoice.totalAmount) - newPaidAmount - Number(invoice.writeOffAmount)

        await tx.invoice.update({
          where: { id: input.invoiceId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            balanceDue: new Decimal(Math.max(0, newBalanceDue)),
            status: newBalanceDue <= 0 ? 'paid' : invoice.status,
            paidAt: newBalanceDue <= 0 ? new Date() : null,
          },
        })

        await tx.paymentAllocation.create({
          data: {
            paymentId: pmt.id,
            invoiceId: input.invoiceId,
            amount: new Decimal(input.amount),
          },
        })
      }
    }

    return pmt
  })

  return payment
}

export async function getPayments(organizationId: string, options?: {
  clientId?: string
  invoiceId?: string
  startDate?: Date
  endDate?: Date
  status?: string
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.clientId) {
    where.clientId = options.clientId
  }
  if (options?.invoiceId) {
    where.invoiceId = options.invoiceId
  }
  if (options?.status) {
    where.status = options.status
  }
  if (options?.startDate || options?.endDate) {
    where.paymentDate = {}
    if (options?.startDate) {
      (where.paymentDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.paymentDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        client: true,
        invoice: true,
        allocations: true,
      },
      orderBy: { paymentDate: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.payment.count({ where }),
  ])

  return { payments, total }
}

export async function getPaymentById(id: string, organizationId: string) {
  return prisma.payment.findFirst({
    where: { id, organizationId },
    include: {
      client: true,
      invoice: true,
      allocations: true,
    },
  })
}

export async function refundPayment(
  id: string,
  organizationId: string,
  refundAmount?: number
) {
  const payment = await prisma.payment.findFirst({
    where: { id, organizationId, status: 'completed' },
    include: { invoice: true },
  })

  if (!payment) {
    throw new Error('Payment not found or already refunded')
  }

  const amount = refundAmount || Number(payment.amount)

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: {
        status: 'refunded',
        notes: `${payment.notes || ''}\nRefunded: $${amount}`,
      },
    })

    if (payment.invoiceId && payment.invoice) {
      const newPaidAmount = Math.max(0, Number(payment.invoice.paidAmount) - amount)
      const newBalanceDue = Number(payment.invoice.totalAmount) - newPaidAmount - Number(payment.invoice.writeOffAmount)

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: new Decimal(newPaidAmount),
          balanceDue: new Decimal(newBalanceDue),
          status: newBalanceDue > 0 ? 'sent' : payment.invoice.status,
          paidAt: null,
        },
      })
    }
  })
}

// ============================================================================
// BILLING RATE SERVICE
// ============================================================================

export interface CreateBillingRateInput {
  organizationId: string
  userId?: string
  clientId?: string
  matterId?: string
  matterType?: string
  rateType: 'hourly' | 'fixed' | 'contingency'
  rate: number
  currency?: string
  effectiveDate: Date
  expirationDate?: Date
  isDefault?: boolean
}

export async function createBillingRate(input: CreateBillingRateInput) {
  return prisma.billingRate.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      clientId: input.clientId,
      matterId: input.matterId,
      matterType: input.matterType,
      rateType: input.rateType,
      rate: new Decimal(input.rate),
      currency: input.currency || 'USD',
      effectiveDate: input.effectiveDate,
      expirationDate: input.expirationDate,
      isDefault: input.isDefault || false,
    },
  })
}

export async function getBillingRates(organizationId: string, options?: {
  userId?: string
  clientId?: string
  matterId?: string
  rateType?: string
  activeOnly?: boolean
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.userId) {
    where.userId = options.userId
  }
  if (options?.clientId) {
    where.clientId = options.clientId
  }
  if (options?.matterId) {
    where.matterId = options.matterId
  }
  if (options?.rateType) {
    where.rateType = options.rateType
  }
  if (options?.activeOnly) {
    const now = new Date()
    where.effectiveDate = { lte: now }
    where.OR = [
      { expirationDate: null },
      { expirationDate: { gte: now } },
    ]
  }

  return prisma.billingRate.findMany({
    where,
    orderBy: [{ effectiveDate: 'desc' }, { isDefault: 'desc' }],
  })
}

export async function getEffectiveRate(
  organizationId: string,
  userId: string,
  clientId?: string,
  matterId?: string
): Promise<number | null> {
  const now = new Date()

  const rates = await prisma.billingRate.findMany({
    where: {
      organizationId,
      effectiveDate: { lte: now },
      OR: [
        { expirationDate: null },
        { expirationDate: { gte: now } },
      ],
      AND: [
        {
          OR: [
            { userId },
            { userId: null },
          ],
        },
        {
          OR: [
            { clientId },
            { clientId: null },
          ],
        },
        {
          OR: [
            { matterId },
            { matterId: null },
          ],
        },
      ],
    },
    orderBy: [
      { matterId: 'desc' },
      { clientId: 'desc' },
      { userId: 'desc' },
      { effectiveDate: 'desc' },
    ],
  })

  if (rates.length === 0) {
    return null
  }

  return Number(rates[0].rate)
}

// ============================================================================
// BILLING REPORTS
// ============================================================================

export async function getARAgingReport(organizationId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ['sent', 'viewed', 'overdue'] },
      balanceDue: { gt: 0 },
    },
    include: { client: true, matter: true },
    orderBy: { dueDate: 'asc' },
  })

  const now = new Date()
  const aging = {
    current: [] as typeof invoices,
    days1to30: [] as typeof invoices,
    days31to60: [] as typeof invoices,
    days61to90: [] as typeof invoices,
    over90: [] as typeof invoices,
  }

  for (const invoice of invoices) {
    const daysOverdue = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysOverdue <= 0) {
      aging.current.push(invoice)
    } else if (daysOverdue <= 30) {
      aging.days1to30.push(invoice)
    } else if (daysOverdue <= 60) {
      aging.days31to60.push(invoice)
    } else if (daysOverdue <= 90) {
      aging.days61to90.push(invoice)
    } else {
      aging.over90.push(invoice)
    }
  }

  const sumBalance = (invs: typeof invoices) =>
    invs.reduce((sum, i) => sum + Number(i.balanceDue), 0)

  return {
    current: { invoices: aging.current, total: sumBalance(aging.current) },
    days1to30: { invoices: aging.days1to30, total: sumBalance(aging.days1to30) },
    days31to60: { invoices: aging.days31to60, total: sumBalance(aging.days31to60) },
    days61to90: { invoices: aging.days61to90, total: sumBalance(aging.days61to90) },
    over90: { invoices: aging.over90, total: sumBalance(aging.over90) },
    grandTotal: sumBalance(invoices),
  }
}

export async function getCollectionsReport(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const payments = await prisma.payment.findMany({
    where: {
      organizationId,
      status: 'completed',
      paymentDate: { gte: startDate, lte: endDate },
    },
    include: { client: true, invoice: true },
    orderBy: { paymentDate: 'desc' },
  })

  const byMethod: Record<string, number> = {}
  const byClient: Record<string, { clientName: string; total: number }> = {}

  for (const payment of payments) {
    const method = payment.paymentMethod
    byMethod[method] = (byMethod[method] || 0) + Number(payment.amount)

    const clientId = payment.clientId
    if (!byClient[clientId]) {
      byClient[clientId] = {
        clientName: payment.client.displayName,
        total: 0,
      }
    }
    byClient[clientId].total += Number(payment.amount)
  }

  return {
    periodStart: startDate,
    periodEnd: endDate,
    totalCollected: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    paymentCount: payments.length,
    byMethod,
    byClient: Object.values(byClient).sort((a, b) => b.total - a.total),
    payments,
  }
}

export async function getWIPReport(organizationId: string) {
  const unbilledTime = await prisma.timeEntry.findMany({
    where: {
      organizationId,
      isBillable: true,
      isBilled: false,
      status: { in: ['draft', 'submitted', 'approved'] },
    },
    include: { matter: { include: { client: true } } },
    orderBy: { date: 'desc' },
  })

  const unbilledExpenses = await prisma.expense.findMany({
    where: {
      organizationId,
      isBillable: true,
      isBilled: false,
      status: { in: ['approved'] },
    },
    include: { matter: { include: { client: true } } },
    orderBy: { expenseDate: 'desc' },
  })

  const totalUnbilledTime = unbilledTime.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalUnbilledExpenses = unbilledExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const byMatter: Record<string, {
    matterId: string
    matterName: string
    clientName: string
    timeAmount: number
    expenseAmount: number
    total: number
  }> = {}

  for (const entry of unbilledTime) {
    const matterId = entry.matterId
    if (!byMatter[matterId]) {
      byMatter[matterId] = {
        matterId,
        matterName: entry.matter.name,
        clientName: entry.matter.client.displayName,
        timeAmount: 0,
        expenseAmount: 0,
        total: 0,
      }
    }
    byMatter[matterId].timeAmount += Number(entry.amount)
    byMatter[matterId].total += Number(entry.amount)
  }

  for (const expense of unbilledExpenses) {
    if (!expense.matterId) continue
    const matterId = expense.matterId
    if (!byMatter[matterId] && expense.matter) {
      byMatter[matterId] = {
        matterId,
        matterName: expense.matter.name,
        clientName: expense.matter.client.displayName,
        timeAmount: 0,
        expenseAmount: 0,
        total: 0,
      }
    }
    if (byMatter[matterId]) {
      byMatter[matterId].expenseAmount += Number(expense.amount)
      byMatter[matterId].total += Number(expense.amount)
    }
  }

  return {
    totalUnbilledTime,
    totalUnbilledExpenses,
    totalWIP: totalUnbilledTime + totalUnbilledExpenses,
    timeEntryCount: unbilledTime.length,
    expenseCount: unbilledExpenses.length,
    byMatter: Object.values(byMatter).sort((a, b) => b.total - a.total),
  }
}

// ============================================================================
// AI BILLING FEATURES
// ============================================================================

export async function getRevenueForecast(organizationId: string) {
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const historicalPayments = await prisma.payment.findMany({
    where: {
      organizationId,
      status: 'completed',
      paymentDate: { gte: threeMonthsAgo },
    },
  })

  const monthlyTotals: Record<string, number> = {}
  for (const payment of historicalPayments) {
    const monthKey = `${payment.paymentDate.getFullYear()}-${String(payment.paymentDate.getMonth() + 1).padStart(2, '0')}`
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(payment.amount)
  }

  const avgMonthlyRevenue =
    Object.values(monthlyTotals).reduce((sum, v) => sum + v, 0) /
    Math.max(Object.keys(monthlyTotals).length, 1)

  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ['sent', 'viewed', 'overdue'] },
      balanceDue: { gt: 0 },
    },
  })

  const expectedCollections = outstandingInvoices.reduce((sum, inv) => {
    const probability = inv.aiPaymentProbability || 70
    return sum + Number(inv.balanceDue) * (probability / 100)
  }, 0)

  const wipReport = await getWIPReport(organizationId)

  const forecast = []
  for (let i = 1; i <= 3; i++) {
    const forecastDate = new Date(now)
    forecastDate.setMonth(forecastDate.getMonth() + i)

    forecast.push({
      month: forecastDate.toISOString().slice(0, 7),
      projectedRevenue: avgMonthlyRevenue,
      expectedCollections: expectedCollections / 3,
      potentialBillings: wipReport.totalWIP / 3,
      total: avgMonthlyRevenue + expectedCollections / 3,
    })
  }

  return {
    historicalAverage: avgMonthlyRevenue,
    outstandingAR: outstandingInvoices.reduce((sum, i) => sum + Number(i.balanceDue), 0),
    expectedCollections,
    unbilledWIP: wipReport.totalWIP,
    forecast,
  }
}

export async function getWriteOffSuggestions(organizationId: string) {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ['sent', 'viewed', 'overdue'] },
      balanceDue: { gt: 0 },
      dueDate: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
    include: { client: true, matter: true },
    orderBy: { dueDate: 'asc' },
  })

  return overdueInvoices.map((invoice) => {
    const daysOverdue = Math.floor(
      (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    let suggestedWriteOffPercent = 0
    if (daysOverdue > 180) {
      suggestedWriteOffPercent = 75
    } else if (daysOverdue > 120) {
      suggestedWriteOffPercent = 50
    } else if (daysOverdue > 90) {
      suggestedWriteOffPercent = 25
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.displayName,
      matterName: invoice.matter?.name,
      balanceDue: Number(invoice.balanceDue),
      daysOverdue,
      suggestedWriteOffPercent,
      suggestedWriteOffAmount: Number(invoice.balanceDue) * (suggestedWriteOffPercent / 100),
      reason: `Invoice is ${daysOverdue} days overdue`,
    }
  })
}
