import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { createJournalEntry, generateJournalNumber } from './finance-service'

// ============================================================================
// AUTOMATIC JOURNAL ENTRY GENERATION
// ============================================================================

/**
 * Automatically creates journal entries from billing transactions
 */
export async function createJournalFromInvoice(
  organizationId: string,
  invoiceId: string,
  createdBy: string
): Promise<{ journalEntryId: string; journalNumber: string }> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: { lineItems: true },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Find the appropriate accounts
  const arAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '1100',
    accountName: 'Accounts Receivable',
    accountType: 'asset',
    normalBalance: 'debit',
  })

  const revenueAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '4000',
    accountName: 'Legal Fees',
    accountType: 'revenue',
    normalBalance: 'credit',
  })

  const entries = [
    {
      accountId: arAccount.id,
      debit: Number(invoice.totalAmount),
      credit: 0,
      description: `Invoice ${invoice.invoiceNumber} - Accounts Receivable`,
      referenceId: invoiceId,
      referenceType: 'invoice',
    },
    {
      accountId: revenueAccount.id,
      debit: 0,
      credit: Number(invoice.subtotal),
      description: `Invoice ${invoice.invoiceNumber} - Legal Fees Revenue`,
      referenceId: invoiceId,
      referenceType: 'invoice',
    },
  ]

  // Add tax entry if applicable
  if (Number(invoice.taxAmount) > 0) {
    const taxLiabilityAccount = await findOrCreateAccount(organizationId, {
      accountNumber: '2400',
      accountName: 'Sales Tax Payable',
      accountType: 'liability',
      normalBalance: 'credit',
    })

    entries.push({
      accountId: taxLiabilityAccount.id,
      debit: 0,
      credit: Number(invoice.taxAmount),
      description: `Invoice ${invoice.invoiceNumber} - Sales Tax`,
      referenceId: invoiceId,
      referenceType: 'invoice',
    })
  }

  const journalEntry = await createJournalEntry({
    organizationId,
    journalType: 'standard',
    description: `Invoice ${invoice.invoiceNumber} issued to client`,
    postedDate: new Date(invoice.issueDate),
    entries,
    createdBy,
  })

  return {
    journalEntryId: journalEntry.id,
    journalNumber: journalEntry.journalNumber,
  }
}

/**
 * Automatically creates journal entries from payment receipts
 */
export async function createJournalFromPayment(
  organizationId: string,
  paymentId: string,
  createdBy: string
): Promise<{ journalEntryId: string; journalNumber: string }> {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId },
    include: { invoice: true },
  })

  if (!payment) {
    throw new Error('Payment not found')
  }

  // Find the appropriate accounts
  const cashAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '1000',
    accountName: 'Cash - Operating',
    accountType: 'asset',
    normalBalance: 'debit',
  })

  const arAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '1100',
    accountName: 'Accounts Receivable',
    accountType: 'asset',
    normalBalance: 'debit',
  })

  const entries = [
    {
      accountId: cashAccount.id,
      debit: Number(payment.amount),
      credit: 0,
      description: `Payment received - ${payment.paymentMethod}`,
      referenceId: paymentId,
      referenceType: 'payment',
    },
    {
      accountId: arAccount.id,
      debit: 0,
      credit: Number(payment.amount),
      description: `Payment applied to ${payment.invoice?.invoiceNumber || 'account'}`,
      referenceId: paymentId,
      referenceType: 'payment',
    },
  ]

  // Handle processor fees if applicable
  if (payment.processorFee && Number(payment.processorFee) > 0) {
    const feeAccount = await findOrCreateAccount(organizationId, {
      accountNumber: '6800',
      accountName: 'Payment Processing Fees',
      accountType: 'expense',
      normalBalance: 'debit',
    })

    // Adjust cash entry for net amount
    entries[0].debit = Number(payment.netAmount || payment.amount)
    
    entries.push({
      accountId: feeAccount.id,
      debit: Number(payment.processorFee),
      credit: 0,
      description: `Processing fee for payment`,
      referenceId: paymentId,
      referenceType: 'payment',
    })
  }

  const journalEntry = await createJournalEntry({
    organizationId,
    journalType: 'standard',
    description: `Payment received: $${Number(payment.amount).toLocaleString()}`,
    postedDate: new Date(payment.paymentDate),
    entries,
    createdBy,
  })

  return {
    journalEntryId: journalEntry.id,
    journalNumber: journalEntry.journalNumber,
  }
}

/**
 * Automatically creates journal entries from expense entries
 */
export async function createJournalFromExpense(
  organizationId: string,
  expenseId: string,
  createdBy: string
): Promise<{ journalEntryId: string; journalNumber: string }> {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, organizationId },
    include: { vendor: true },
  })

  if (!expense) {
    throw new Error('Expense not found')
  }

  // Map expense category to account
  const expenseAccountMapping: Record<string, { number: string; name: string }> = {
    court_fees: { number: '6300', name: 'Court Costs' },
    expert_witness: { number: '6400', name: 'Expert Witness Fees' },
    travel: { number: '6200', name: 'Travel Expenses' },
    meals: { number: '6250', name: 'Meals & Entertainment' },
    office_supplies: { number: '6100', name: 'Office Supplies' },
    research: { number: '6350', name: 'Research & Subscriptions' },
    copying: { number: '6150', name: 'Copying & Printing' },
    postage: { number: '6160', name: 'Postage & Delivery' },
    technology: { number: '6600', name: 'Technology & Software' },
    professional_services: { number: '6450', name: 'Professional Services' },
    insurance: { number: '6500', name: 'Insurance' },
    marketing: { number: '6700', name: 'Marketing & Advertising' },
  }

  const accountInfo = expenseAccountMapping[expense.category] || {
    number: '6900',
    name: 'Other Expenses',
  }

  const expenseAccount = await findOrCreateAccount(organizationId, {
    accountNumber: accountInfo.number,
    accountName: accountInfo.name,
    accountType: 'expense',
    normalBalance: 'debit',
  })

  // Determine credit account based on payment method
  let creditAccount
  if (expense.paymentMethod === 'firm_card' || expense.paymentMethod === 'cash') {
    creditAccount = await findOrCreateAccount(organizationId, {
      accountNumber: '1000',
      accountName: 'Cash - Operating',
      accountType: 'asset',
      normalBalance: 'debit',
    })
  } else if (expense.paymentMethod === 'personal') {
    creditAccount = await findOrCreateAccount(organizationId, {
      accountNumber: '2300',
      accountName: 'Employee Reimbursements Payable',
      accountType: 'liability',
      normalBalance: 'credit',
    })
  } else {
    creditAccount = await findOrCreateAccount(organizationId, {
      accountNumber: '2000',
      accountName: 'Accounts Payable',
      accountType: 'liability',
      normalBalance: 'credit',
    })
  }

  const entries = [
    {
      accountId: expenseAccount.id,
      debit: Number(expense.amount),
      credit: 0,
      description: expense.description,
      referenceId: expenseId,
      referenceType: 'expense',
    },
    {
      accountId: creditAccount.id,
      debit: 0,
      credit: Number(expense.amount),
      description: `${expense.description} - ${expense.paymentMethod || 'payment'}`,
      referenceId: expenseId,
      referenceType: 'expense',
    },
  ]

  const journalEntry = await createJournalEntry({
    organizationId,
    journalType: 'standard',
    description: `Expense: ${expense.description}`,
    postedDate: new Date(expense.expenseDate),
    entries,
    createdBy,
  })

  return {
    journalEntryId: journalEntry.id,
    journalNumber: journalEntry.journalNumber,
  }
}

/**
 * Automatically creates journal entries from trust transfers
 */
export async function createJournalFromTrustTransfer(
  organizationId: string,
  trustTransactionId: string,
  createdBy: string
): Promise<{ journalEntryId: string; journalNumber: string }> {
  const transaction = await prisma.trustTransaction.findFirst({
    where: { id: trustTransactionId },
    include: {
      trustAccount: true,
      clientLedger: { include: { client: true } },
    },
  })

  if (!transaction) {
    throw new Error('Trust transaction not found')
  }

  // Verify organization access
  if (transaction.trustAccount.organizationId !== organizationId) {
    throw new Error('Access denied')
  }

  let entries: Array<{
    accountId: string
    debit: number
    credit: number
    description: string
    referenceId: string
    referenceType: string
  }> = []

  const trustCashAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '1010',
    accountName: 'Cash - IOLTA Trust',
    accountType: 'asset',
    normalBalance: 'debit',
  })

  const trustLiabilityAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '2100',
    accountName: 'Client Trust Liability',
    accountType: 'liability',
    normalBalance: 'credit',
  })

  const operatingCashAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '1000',
    accountName: 'Cash - Operating',
    accountType: 'asset',
    normalBalance: 'debit',
  })

  const arAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '1100',
    accountName: 'Accounts Receivable',
    accountType: 'asset',
    normalBalance: 'debit',
  })

  const clientName = transaction.clientLedger.client?.displayName || 'Client'

  switch (transaction.transactionType) {
    case 'deposit':
      // Deposit into trust: Debit Trust Cash, Credit Trust Liability
      entries = [
        {
          accountId: trustCashAccount.id,
          debit: Number(transaction.amount),
          credit: 0,
          description: `Trust deposit from ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
        {
          accountId: trustLiabilityAccount.id,
          debit: 0,
          credit: Number(transaction.amount),
          description: `Trust liability for ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
      ]
      break

    case 'transfer_to_operating':
      // Transfer earned fees: Debit Trust Liability, Credit Trust Cash, Debit Operating Cash, Credit AR
      entries = [
        {
          accountId: trustLiabilityAccount.id,
          debit: Number(transaction.amount),
          credit: 0,
          description: `Transfer earned fees for ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
        {
          accountId: trustCashAccount.id,
          debit: 0,
          credit: Number(transaction.amount),
          description: `Trust transfer out for ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
        {
          accountId: operatingCashAccount.id,
          debit: Number(transaction.amount),
          credit: 0,
          description: `Received from trust for ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
        {
          accountId: arAccount.id,
          debit: 0,
          credit: Number(transaction.amount),
          description: `Applied trust payment for ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
      ]
      break

    case 'disbursement':
      // Disbursement to third party: Debit Trust Liability, Credit Trust Cash
      entries = [
        {
          accountId: trustLiabilityAccount.id,
          debit: Number(transaction.amount),
          credit: 0,
          description: `Trust disbursement for ${clientName} to ${transaction.payee || 'third party'}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
        {
          accountId: trustCashAccount.id,
          debit: 0,
          credit: Number(transaction.amount),
          description: `Trust disbursement check to ${transaction.payee || 'third party'}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
      ]
      break

    case 'refund':
      // Refund to client: Debit Trust Liability, Credit Trust Cash
      entries = [
        {
          accountId: trustLiabilityAccount.id,
          debit: Number(transaction.amount),
          credit: 0,
          description: `Trust refund to ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
        {
          accountId: trustCashAccount.id,
          debit: 0,
          credit: Number(transaction.amount),
          description: `Trust refund check to ${clientName}`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
      ]
      break

    case 'interest':
      // Interest earned: Debit Trust Cash, Credit Interest Income
      const interestIncomeAccount = await findOrCreateAccount(organizationId, {
        accountNumber: '4500',
        accountName: 'Interest Income - Trust',
        accountType: 'revenue',
        normalBalance: 'credit',
      })

      entries = [
        {
          accountId: trustCashAccount.id,
          debit: Number(transaction.amount),
          credit: 0,
          description: `Interest earned on trust account`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
        {
          accountId: interestIncomeAccount.id,
          debit: 0,
          credit: Number(transaction.amount),
          description: `Trust interest income`,
          referenceId: trustTransactionId,
          referenceType: 'trust_transfer',
        },
      ]
      break

    default:
      throw new Error(`Unknown transaction type: ${transaction.transactionType}`)
  }

  const journalEntry = await createJournalEntry({
    organizationId,
    journalType: 'standard',
    description: `Trust ${transaction.transactionType}: ${transaction.description}`,
    postedDate: new Date(transaction.transactionDate),
    entries,
    createdBy,
  })

  return {
    journalEntryId: journalEntry.id,
    journalNumber: journalEntry.journalNumber,
  }
}

/**
 * Creates journal entry from vendor bill payment
 */
export async function createJournalFromVendorPayment(
  organizationId: string,
  vendorPaymentId: string,
  createdBy: string
): Promise<{ journalEntryId: string; journalNumber: string }> {
  const payment = await prisma.vendorPayment.findFirst({
    where: { id: vendorPaymentId, organizationId },
    include: { vendor: true, bill: true },
  })

  if (!payment) {
    throw new Error('Vendor payment not found')
  }

  const cashAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '1000',
    accountName: 'Cash - Operating',
    accountType: 'asset',
    normalBalance: 'debit',
  })

  const apAccount = await findOrCreateAccount(organizationId, {
    accountNumber: '2000',
    accountName: 'Accounts Payable',
    accountType: 'liability',
    normalBalance: 'credit',
  })

  const entries = [
    {
      accountId: apAccount.id,
      debit: Number(payment.amount),
      credit: 0,
      description: `Payment to ${payment.vendor?.name || 'vendor'}`,
      referenceId: vendorPaymentId,
      referenceType: 'vendor_payment',
    },
    {
      accountId: cashAccount.id,
      debit: 0,
      credit: Number(payment.amount),
      description: `${payment.paymentMethod} payment to ${payment.vendor?.name || 'vendor'}`,
      referenceId: vendorPaymentId,
      referenceType: 'vendor_payment',
    },
  ]

  const journalEntry = await createJournalEntry({
    organizationId,
    journalType: 'standard',
    description: `Vendor payment: ${payment.vendor?.name || 'vendor'} - $${Number(payment.amount).toLocaleString()}`,
    postedDate: new Date(payment.paymentDate),
    entries,
    createdBy,
  })

  return {
    journalEntryId: journalEntry.id,
    journalNumber: journalEntry.journalNumber,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface AccountParams {
  accountNumber: string
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  normalBalance: 'debit' | 'credit'
}

async function findOrCreateAccount(
  organizationId: string,
  params: AccountParams
) {
  let account = await prisma.chartOfAccount.findFirst({
    where: {
      organizationId,
      OR: [
        { accountNumber: params.accountNumber },
        { accountName: { equals: params.accountName, mode: 'insensitive' } },
      ],
      isActive: true,
    },
  })

  if (!account) {
    account = await prisma.chartOfAccount.create({
      data: {
        organizationId,
        accountNumber: params.accountNumber,
        accountName: params.accountName,
        accountType: params.accountType,
        normalBalance: params.normalBalance,
        currency: 'USD',
        isActive: true,
      },
    })
  }

  return account
}

/**
 * Batch process pending transactions to create journal entries
 */
export async function processPendingJournalEntries(
  organizationId: string,
  createdBy: string
): Promise<{
  processed: number
  errors: Array<{ type: string; id: string; error: string }>
}> {
  const errors: Array<{ type: string; id: string; error: string }> = []
  let processed = 0

  // Find invoices without journal entries
  const invoicesWithoutJE = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ['sent', 'viewed', 'paid', 'overdue'] },
    },
  })

  for (const invoice of invoicesWithoutJE) {
    // Check if journal entry already exists
    const existingJE = await prisma.generalLedgerEntry.findFirst({
      where: {
        organizationId,
        referenceId: invoice.id,
        referenceType: 'invoice',
      },
    })

    if (!existingJE) {
      try {
        await createJournalFromInvoice(organizationId, invoice.id, createdBy)
        processed++
      } catch (error) {
        errors.push({
          type: 'invoice',
          id: invoice.id,
          error: (error as Error).message,
        })
      }
    }
  }

  // Find payments without journal entries
  const paymentsWithoutJE = await prisma.payment.findMany({
    where: {
      organizationId,
      status: 'completed',
    },
  })

  for (const payment of paymentsWithoutJE) {
    const existingJE = await prisma.generalLedgerEntry.findFirst({
      where: {
        organizationId,
        referenceId: payment.id,
        referenceType: 'payment',
      },
    })

    if (!existingJE) {
      try {
        await createJournalFromPayment(organizationId, payment.id, createdBy)
        processed++
      } catch (error) {
        errors.push({
          type: 'payment',
          id: payment.id,
          error: (error as Error).message,
        })
      }
    }
  }

  // Find approved expenses without journal entries
  const expensesWithoutJE = await prisma.expense.findMany({
    where: {
      organizationId,
      status: { in: ['approved', 'paid'] },
    },
  })

  for (const expense of expensesWithoutJE) {
    const existingJE = await prisma.generalLedgerEntry.findFirst({
      where: {
        organizationId,
        referenceId: expense.id,
        referenceType: 'expense',
      },
    })

    if (!existingJE) {
      try {
        await createJournalFromExpense(organizationId, expense.id, createdBy)
        processed++
      } catch (error) {
        errors.push({
          type: 'expense',
          id: expense.id,
          error: (error as Error).message,
        })
      }
    }
  }

  return { processed, errors }
}
