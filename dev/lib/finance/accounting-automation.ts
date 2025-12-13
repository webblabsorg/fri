import { prisma } from '@/lib/db'
import { createJournalEntry as createJE, type CreateJournalEntryInput } from './finance-service'
import { getOrganizationBaseCurrency } from './finance-settings'

// ============================================================================
// ACCOUNTING AUTOMATION SERVICE
// Automated journal entry creation for key financial events
// Uses the unified createJournalEntry from finance-service.ts
// ============================================================================

// Standard account codes used across the system (consistent with ACCOUNT_TEMPLATES)
export const STANDARD_ACCOUNTS = {
  // Assets (1xxx)
  OPERATING_CASH: '1000',
  TRUST_CASH: '1010',
  ACCOUNTS_RECEIVABLE: '1100',
  UNBILLED_WIP: '1200',
  PREPAID_EXPENSES: '1300',
  
  // Liabilities (2xxx)
  ACCOUNTS_PAYABLE: '2000',
  CLIENT_TRUST_LIABILITY: '2100',
  EMPLOYEE_REIMBURSABLE: '2200',
  ACCRUED_EXPENSES: '2300',
  SALES_TAX_PAYABLE: '2400',
  
  // Equity (3xxx)
  RETAINED_EARNINGS: '3000',
  OWNER_EQUITY: '3100',
  
  // Revenue (4xxx)
  LEGAL_SERVICES_REVENUE: '4000',
  CONSULTATION_FEES: '4100',
  RETAINER_FEES: '4200',
  INTEREST_INCOME: '4900',
  
  // Expenses (5xxx)
  OPERATING_EXPENSES: '5000',
  TRAVEL_EXPENSES: '5100',
  MEALS_ENTERTAINMENT: '5200',
  OFFICE_SUPPLIES: '5300',
  COURT_FILING_FEES: '5400',
  EXPERT_WITNESS_FEES: '5500',
  RESEARCH_EXPENSES: '5600',
  PROFESSIONAL_FEES: '5700',
  BANK_FEES: '5800',
  PAYMENT_PROCESSING_FEES: '5850',
}

export interface AutoJournalEntryInput {
  organizationId: string
  entryDate: Date
  description: string
  lines: Array<{
    accountCode: string
    debit?: number
    credit?: number
    description: string
    currency?: string
  }>
  sourceType: string
  sourceId: string
  createdBy: string
}

/**
 * Create an automated journal entry using standard account codes
 * This is the unified entry point for all automated accounting
 */
export async function createAutomatedJournalEntry(input: AutoJournalEntryInput) {
  // Resolve account codes to account IDs
  const resolvedLines = await Promise.all(
    input.lines.map(async (line) => {
      const account = await findAccountByCode(input.organizationId, line.accountCode)
      if (!account) {
        throw new Error(`Account not found: ${line.accountCode} for organization ${input.organizationId}`)
      }
      return {
        accountId: account.id,
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description,
        currency: line.currency,
      }
    })
  )

  const baseCurrency = await getOrganizationBaseCurrency(input.organizationId)

  // Use the unified createJournalEntry from finance-service
  return createJE({
    organizationId: input.organizationId,
    journalType: 'standard',
    description: input.description,
    postedDate: input.entryDate,
    entries: resolvedLines,
    createdBy: input.createdBy,
    baseCurrency,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    autoPost: true, // Automated entries are auto-posted
  })
}

// ============================================================================
// AUTOMATED JOURNAL ENTRIES FOR FINANCIAL EVENTS
// ============================================================================

export async function createInvoiceJournalEntry(
  organizationId: string,
  invoiceId: string,
  clientId: string,
  amount: number,
  createdBy: string,
  currency?: string
) {
  try {
    return await createAutomatedJournalEntry({
      organizationId,
      entryDate: new Date(),
      description: `Invoice issued - Client: ${clientId}`,
      lines: [
        { accountCode: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE, debit: amount, description: 'Accounts Receivable', currency },
        { accountCode: STANDARD_ACCOUNTS.LEGAL_SERVICES_REVENUE, credit: amount, description: 'Legal Services Revenue', currency },
      ],
      sourceType: 'invoice',
      sourceId: invoiceId,
      createdBy,
    })
  } catch (err) {
    console.warn('Failed to create invoice journal entry:', err)
    return null
  }
}

export async function createPaymentJournalEntry(
  organizationId: string,
  paymentId: string,
  invoiceId: string,
  amount: number,
  paymentMethod: string,
  createdBy: string,
  processingFee?: number,
  currency?: string
) {
  try {
    const lines = [
      { accountCode: STANDARD_ACCOUNTS.OPERATING_CASH, debit: amount - (processingFee || 0), description: 'Cash/Bank', currency },
      { accountCode: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE, credit: amount, description: 'Accounts Receivable', currency },
    ]
    
    // Add processing fee line if applicable
    if (processingFee && processingFee > 0) {
      lines.push({
        accountCode: STANDARD_ACCOUNTS.PAYMENT_PROCESSING_FEES,
        debit: processingFee,
        description: `Payment processing fee - ${paymentMethod}`,
        currency,
      })
    }

    return await createAutomatedJournalEntry({
      organizationId,
      entryDate: new Date(),
      description: `Payment received via ${paymentMethod} - Invoice: ${invoiceId}`,
      lines,
      sourceType: 'payment',
      sourceId: paymentId,
      createdBy,
    })
  } catch (err) {
    console.warn('Failed to create payment journal entry:', err)
    return null
  }
}

export async function createTrustDepositJournalEntry(
  organizationId: string,
  transactionId: string,
  clientId: string,
  amount: number,
  createdBy: string
) {
  try {
    return await createAutomatedJournalEntry({
      organizationId,
      entryDate: new Date(),
      description: `Trust deposit received - Client: ${clientId}`,
      lines: [
        { accountCode: STANDARD_ACCOUNTS.TRUST_CASH, debit: amount, description: 'Trust Cash (IOLTA)' },
        { accountCode: STANDARD_ACCOUNTS.CLIENT_TRUST_LIABILITY, credit: amount, description: 'Client Trust Liability' },
      ],
      sourceType: 'trust_deposit',
      sourceId: transactionId,
      createdBy,
    })
  } catch (err) {
    console.warn('Failed to create trust deposit journal entry:', err)
    return null
  }
}

export async function createTrustDisbursementJournalEntry(
  organizationId: string,
  transactionId: string,
  clientId: string,
  amount: number,
  createdBy: string
) {
  try {
    return await createAutomatedJournalEntry({
      organizationId,
      entryDate: new Date(),
      description: `Trust disbursement - Client: ${clientId}`,
      lines: [
        { accountCode: STANDARD_ACCOUNTS.CLIENT_TRUST_LIABILITY, debit: amount, description: 'Client Trust Liability' },
        { accountCode: STANDARD_ACCOUNTS.TRUST_CASH, credit: amount, description: 'Trust Cash (IOLTA)' },
      ],
      sourceType: 'trust_disbursement',
      sourceId: transactionId,
      createdBy,
    })
  } catch (err) {
    console.warn('Failed to create trust disbursement journal entry:', err)
    return null
  }
}

export async function createExpenseJournalEntry(
  organizationId: string,
  expenseId: string,
  category: string,
  amount: number,
  paymentMethod: string,
  createdBy: string
) {
  try {
    const expenseAccountCode = getExpenseAccountCode(category)
    const creditAccountCode = paymentMethod === 'personal'
      ? STANDARD_ACCOUNTS.EMPLOYEE_REIMBURSABLE
      : STANDARD_ACCOUNTS.OPERATING_CASH

    return await createAutomatedJournalEntry({
      organizationId,
      entryDate: new Date(),
      description: `Expense: ${category}`,
      lines: [
        { accountCode: expenseAccountCode, debit: amount, description: `${category} expense` },
        { accountCode: creditAccountCode, credit: amount, description: paymentMethod === 'personal' ? 'Employee Reimbursable' : 'Cash/Bank' },
      ],
      sourceType: 'expense',
      sourceId: expenseId,
      createdBy,
    })
  } catch (err) {
    console.warn('Failed to create expense journal entry:', err)
    return null
  }
}

export async function createVendorBillJournalEntry(
  organizationId: string,
  billId: string,
  vendorId: string,
  amount: number,
  createdBy: string,
  expenseCategory?: string
) {
  try {
    const expenseAccountCode = expenseCategory 
      ? getExpenseAccountCode(expenseCategory)
      : STANDARD_ACCOUNTS.OPERATING_EXPENSES

    return await createAutomatedJournalEntry({
      organizationId,
      entryDate: new Date(),
      description: `Vendor bill recorded - Vendor: ${vendorId}`,
      lines: [
        { accountCode: expenseAccountCode, debit: amount, description: 'Operating Expense' },
        { accountCode: STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE, credit: amount, description: 'Accounts Payable' },
      ],
      sourceType: 'vendor_bill',
      sourceId: billId,
      createdBy,
    })
  } catch (err) {
    console.warn('Failed to create vendor bill journal entry:', err)
    return null
  }
}

export async function createVendorPaymentJournalEntry(
  organizationId: string,
  paymentId: string,
  billId: string,
  amount: number,
  createdBy: string
) {
  try {
    return await createAutomatedJournalEntry({
      organizationId,
      entryDate: new Date(),
      description: `Vendor payment - Bill: ${billId}`,
      lines: [
        { accountCode: STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE, debit: amount, description: 'Accounts Payable' },
        { accountCode: STANDARD_ACCOUNTS.OPERATING_CASH, credit: amount, description: 'Cash/Bank' },
      ],
      sourceType: 'vendor_payment',
      sourceId: paymentId,
      createdBy,
    })
  } catch (err) {
    console.warn('Failed to create vendor payment journal entry:', err)
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function findAccountByCode(organizationId: string, code: string) {
  return prisma.chartOfAccount.findFirst({
    where: { organizationId, accountNumber: code, isActive: true },
  })
}

/**
 * Map expense category to standard account code
 */
function getExpenseAccountCode(category: string): string {
  const categoryToCode: Record<string, string> = {
    travel: STANDARD_ACCOUNTS.TRAVEL_EXPENSES,
    meals: STANDARD_ACCOUNTS.MEALS_ENTERTAINMENT,
    meals_entertainment: STANDARD_ACCOUNTS.MEALS_ENTERTAINMENT,
    supplies: STANDARD_ACCOUNTS.OFFICE_SUPPLIES,
    office_supplies: STANDARD_ACCOUNTS.OFFICE_SUPPLIES,
    filing_fees: STANDARD_ACCOUNTS.COURT_FILING_FEES,
    court_fees: STANDARD_ACCOUNTS.COURT_FILING_FEES,
    court_costs: STANDARD_ACCOUNTS.COURT_FILING_FEES,
    expert_witness: STANDARD_ACCOUNTS.EXPERT_WITNESS_FEES,
    research: STANDARD_ACCOUNTS.RESEARCH_EXPENSES,
    professional_fees: STANDARD_ACCOUNTS.PROFESSIONAL_FEES,
    bank_fees: STANDARD_ACCOUNTS.BANK_FEES,
    other: STANDARD_ACCOUNTS.OPERATING_EXPENSES,
  }

  return categoryToCode[category.toLowerCase()] || STANDARD_ACCOUNTS.OPERATING_EXPENSES
}

/**
 * Ensure required standard accounts exist for an organization
 * Call this when initializing chart of accounts
 */
export async function ensureStandardAccountsExist(organizationId: string): Promise<boolean> {
  const requiredAccounts = [
    { code: STANDARD_ACCOUNTS.OPERATING_CASH, name: 'Operating Cash', type: 'asset', normalBalance: 'debit' },
    { code: STANDARD_ACCOUNTS.TRUST_CASH, name: 'Trust Cash (IOLTA)', type: 'asset', normalBalance: 'debit' },
    { code: STANDARD_ACCOUNTS.ACCOUNTS_RECEIVABLE, name: 'Accounts Receivable', type: 'asset', normalBalance: 'debit' },
    { code: STANDARD_ACCOUNTS.ACCOUNTS_PAYABLE, name: 'Accounts Payable', type: 'liability', normalBalance: 'credit' },
    { code: STANDARD_ACCOUNTS.CLIENT_TRUST_LIABILITY, name: 'Client Trust Liability', type: 'liability', normalBalance: 'credit' },
    { code: STANDARD_ACCOUNTS.EMPLOYEE_REIMBURSABLE, name: 'Employee Reimbursable', type: 'liability', normalBalance: 'credit' },
    { code: STANDARD_ACCOUNTS.LEGAL_SERVICES_REVENUE, name: 'Legal Services Revenue', type: 'revenue', normalBalance: 'credit' },
    { code: STANDARD_ACCOUNTS.OPERATING_EXPENSES, name: 'Operating Expenses', type: 'expense', normalBalance: 'debit' },
  ]

  for (const acct of requiredAccounts) {
    const existing = await findAccountByCode(organizationId, acct.code)
    if (!existing) {
      await prisma.chartOfAccount.create({
        data: {
          organizationId,
          accountNumber: acct.code,
          accountName: acct.name,
          accountType: acct.type,
          normalBalance: acct.normalBalance,
          isActive: true,
        },
      })
    }
  }

  return true
}
