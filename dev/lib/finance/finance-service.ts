import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// CHART OF ACCOUNTS SERVICE
// ============================================================================

export interface CreateAccountInput {
  organizationId: string
  accountNumber: string
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  parentId?: string
  currency?: string
  description?: string
  normalBalance: 'debit' | 'credit'
}

export interface UpdateAccountInput {
  accountName?: string
  description?: string
  isActive?: boolean
  parentId?: string | null
}

export async function createAccount(input: CreateAccountInput) {
  const account = await prisma.chartOfAccount.create({
    data: {
      organizationId: input.organizationId,
      accountNumber: input.accountNumber,
      accountName: input.accountName,
      accountType: input.accountType,
      parentId: input.parentId,
      currency: input.currency || 'USD',
      description: input.description,
      normalBalance: input.normalBalance,
    },
    include: {
      parent: true,
      children: true,
    },
  })
  return account
}

export async function getAccounts(organizationId: string, options?: {
  accountType?: string
  isActive?: boolean
  includeHierarchy?: boolean
}) {
  const where: Record<string, unknown> = { organizationId }
  
  if (options?.accountType) {
    where.accountType = options.accountType
  }
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive
  }

  const accounts = await prisma.chartOfAccount.findMany({
    where,
    include: options?.includeHierarchy ? {
      parent: true,
      children: {
        include: {
          children: true,
        },
      },
    } : undefined,
    orderBy: { accountNumber: 'asc' },
  })

  return accounts
}

export async function getAccountById(id: string, organizationId: string) {
  return prisma.chartOfAccount.findFirst({
    where: { id, organizationId },
    include: {
      parent: true,
      children: true,
      transactions: {
        take: 50,
        orderBy: { postedDate: 'desc' },
      },
    },
  })
}

export async function updateAccount(id: string, organizationId: string, input: UpdateAccountInput) {
  return prisma.chartOfAccount.update({
    where: { id },
    data: input,
  })
}

export async function deactivateAccount(id: string, organizationId: string) {
  const account = await prisma.chartOfAccount.findFirst({
    where: { id, organizationId },
    include: { transactions: { take: 1 } },
  })

  if (!account) {
    throw new Error('Account not found')
  }

  if (account.transactions.length > 0) {
    return prisma.chartOfAccount.update({
      where: { id },
      data: { isActive: false },
    })
  }

  return prisma.chartOfAccount.delete({ where: { id } })
}

// ============================================================================
// JOURNAL ENTRY SERVICE
// ============================================================================

export interface JournalEntryLineInput {
  accountId: string
  debit: number
  credit: number
  description: string
  referenceId?: string
  referenceType?: string
}

export interface CreateJournalEntryInput {
  organizationId: string
  journalType: 'standard' | 'adjusting' | 'closing' | 'reversing'
  description: string
  postedDate: Date
  entries: JournalEntryLineInput[]
  createdBy: string
}

export async function generateJournalNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.journalEntry.count({
    where: {
      organizationId,
      journalNumber: { startsWith: `JE-${year}-` },
    },
  })
  return `JE-${year}-${String(count + 1).padStart(4, '0')}`
}

export async function createJournalEntry(input: CreateJournalEntryInput) {
  const totalDebit = input.entries.reduce((sum, e) => sum + e.debit, 0)
  const totalCredit = input.entries.reduce((sum, e) => sum + e.credit, 0)

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Journal entry must balance: debits must equal credits')
  }

  const journalNumber = await generateJournalNumber(input.organizationId)
  const fiscalYear = input.postedDate.getFullYear()
  const fiscalPeriod = input.postedDate.getMonth() + 1

  const journalEntry = await prisma.journalEntry.create({
    data: {
      organizationId: input.organizationId,
      journalNumber,
      journalType: input.journalType,
      description: input.description,
      postedDate: input.postedDate,
      status: 'draft',
      totalDebit: new Decimal(totalDebit),
      totalCredit: new Decimal(totalCredit),
      createdBy: input.createdBy,
      entries: {
        create: input.entries.map((entry) => ({
          organizationId: input.organizationId,
          accountId: entry.accountId,
          debit: new Decimal(entry.debit),
          credit: new Decimal(entry.credit),
          description: entry.description,
          referenceId: entry.referenceId,
          referenceType: entry.referenceType,
          currency: 'USD',
          postedDate: input.postedDate,
          fiscalYear,
          fiscalPeriod,
          createdBy: input.createdBy,
        })),
      },
    },
    include: {
      entries: {
        include: { account: true },
      },
    },
  })

  return journalEntry
}

export async function getJournalEntries(organizationId: string, options?: {
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.status) {
    where.status = options.status
  }
  if (options?.startDate || options?.endDate) {
    where.postedDate = {}
    if (options?.startDate) {
      (where.postedDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.postedDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: {
        entries: {
          include: { account: true },
        },
      },
      orderBy: { postedDate: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.journalEntry.count({ where }),
  ])

  return { entries, total }
}

export async function getJournalEntryById(id: string, organizationId: string) {
  return prisma.journalEntry.findFirst({
    where: { id, organizationId },
    include: {
      entries: {
        include: { account: true },
      },
    },
  })
}

export async function postJournalEntry(id: string, organizationId: string, approvedBy: string) {
  const entry = await prisma.journalEntry.findFirst({
    where: { id, organizationId, status: 'draft' },
  })

  if (!entry) {
    throw new Error('Journal entry not found or already posted')
  }

  return prisma.journalEntry.update({
    where: { id },
    data: {
      status: 'posted',
      approvedBy,
      approvedAt: new Date(),
    },
    include: {
      entries: { include: { account: true } },
    },
  })
}

export async function reverseJournalEntry(id: string, organizationId: string, createdBy: string) {
  const original = await prisma.journalEntry.findFirst({
    where: { id, organizationId, status: 'posted' },
    include: { entries: true },
  })

  if (!original) {
    throw new Error('Journal entry not found or not posted')
  }

  await prisma.journalEntry.update({
    where: { id },
    data: { status: 'reversed' },
  })

  const reversalEntries = original.entries.map((e) => ({
    accountId: e.accountId,
    debit: Number(e.credit),
    credit: Number(e.debit),
    description: `Reversal: ${e.description}`,
    referenceId: e.referenceId || undefined,
    referenceType: e.referenceType || undefined,
  }))

  return createJournalEntry({
    organizationId,
    journalType: 'reversing',
    description: `Reversal of ${original.journalNumber}`,
    postedDate: new Date(),
    entries: reversalEntries,
    createdBy,
  })
}

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

export async function getGeneralLedger(organizationId: string, options?: {
  accountId?: string
  startDate?: Date
  endDate?: Date
  fiscalYear?: number
  fiscalPeriod?: number
}) {
  const where: Record<string, unknown> = { organizationId }

  if (options?.accountId) {
    where.accountId = options.accountId
  }
  if (options?.startDate || options?.endDate) {
    where.postedDate = {}
    if (options?.startDate) {
      (where.postedDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.postedDate as Record<string, Date>).lte = options.endDate
    }
  }
  if (options?.fiscalYear) {
    where.fiscalYear = options.fiscalYear
  }
  if (options?.fiscalPeriod) {
    where.fiscalPeriod = options.fiscalPeriod
  }

  const entries = await prisma.generalLedgerEntry.findMany({
    where,
    include: {
      account: true,
      journal: true,
    },
    orderBy: [
      { accountId: 'asc' },
      { postedDate: 'asc' },
    ],
  })

  return entries
}

export async function getTrialBalance(organizationId: string, asOfDate?: Date) {
  const where: Record<string, unknown> = { organizationId }
  
  if (asOfDate) {
    where.postedDate = { lte: asOfDate }
  }

  const entries = await prisma.generalLedgerEntry.groupBy({
    by: ['accountId'],
    where: {
      ...where,
      journal: { status: 'posted' },
    },
    _sum: {
      debit: true,
      credit: true,
    },
  })

  const accounts = await prisma.chartOfAccount.findMany({
    where: { organizationId, isActive: true },
    orderBy: { accountNumber: 'asc' },
  })

  const trialBalance = accounts.map((account) => {
    const entry = entries.find((e) => e.accountId === account.id)
    const debit = Number(entry?._sum.debit || 0)
    const credit = Number(entry?._sum.credit || 0)
    const balance = account.normalBalance === 'debit' ? debit - credit : credit - debit

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      debit,
      credit,
      balance,
    }
  })

  const totalDebit = trialBalance.reduce((sum, a) => sum + a.debit, 0)
  const totalCredit = trialBalance.reduce((sum, a) => sum + a.credit, 0)

  return {
    asOfDate: asOfDate || new Date(),
    accounts: trialBalance,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  }
}

export async function getBalanceSheet(organizationId: string, asOfDate?: Date) {
  const trialBalance = await getTrialBalance(organizationId, asOfDate)

  const assets = trialBalance.accounts.filter((a) => a.accountType === 'asset')
  const liabilities = trialBalance.accounts.filter((a) => a.accountType === 'liability')
  const equity = trialBalance.accounts.filter((a) => a.accountType === 'equity')

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0)
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0)

  return {
    asOfDate: asOfDate || new Date(),
    assets: { accounts: assets, total: totalAssets },
    liabilities: { accounts: liabilities, total: totalLiabilities },
    equity: { accounts: equity, total: totalEquity },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  }
}

export async function getIncomeStatement(organizationId: string, startDate: Date, endDate: Date) {
  const where = {
    organizationId,
    postedDate: { gte: startDate, lte: endDate },
    journal: { status: 'posted' },
  }

  const entries = await prisma.generalLedgerEntry.groupBy({
    by: ['accountId'],
    where,
    _sum: {
      debit: true,
      credit: true,
    },
  })

  const accounts = await prisma.chartOfAccount.findMany({
    where: {
      organizationId,
      accountType: { in: ['revenue', 'expense'] },
      isActive: true,
    },
    orderBy: { accountNumber: 'asc' },
  })

  const incomeStatement = accounts.map((account) => {
    const entry = entries.find((e) => e.accountId === account.id)
    const debit = Number(entry?._sum.debit || 0)
    const credit = Number(entry?._sum.credit || 0)
    const balance = account.normalBalance === 'credit' ? credit - debit : debit - credit

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      amount: balance,
    }
  })

  const revenue = incomeStatement.filter((a) => a.accountType === 'revenue')
  const expenses = incomeStatement.filter((a) => a.accountType === 'expense')

  const totalRevenue = revenue.reduce((sum, a) => sum + a.amount, 0)
  const totalExpenses = expenses.reduce((sum, a) => sum + a.amount, 0)
  const netIncome = totalRevenue - totalExpenses

  return {
    periodStart: startDate,
    periodEnd: endDate,
    revenue: { accounts: revenue, total: totalRevenue },
    expenses: { accounts: expenses, total: totalExpenses },
    netIncome,
  }
}

// ============================================================================
// CHART OF ACCOUNTS TEMPLATES
// ============================================================================

export const ACCOUNT_TEMPLATES = {
  litigation: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '1300', name: 'Prepaid Expenses', type: 'asset', normal: 'debit' },
    { number: '1500', name: 'Office Equipment', type: 'asset', normal: 'debit' },
    { number: '1510', name: 'Accumulated Depreciation', type: 'asset', normal: 'credit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2200', name: 'Accrued Expenses', type: 'liability', normal: 'credit' },
    { number: '2300', name: 'Payroll Liabilities', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Hourly', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Contingency', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - Fixed Fee', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Reimbursed Expenses', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '5100', name: 'Payroll Taxes', type: 'expense', normal: 'debit' },
    { number: '5200', name: 'Employee Benefits', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6100', name: 'Utilities', type: 'expense', normal: 'debit' },
    { number: '6200', name: 'Office Supplies', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'Professional Development', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Bar Dues & Memberships', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
    { number: '6700', name: 'Marketing & Advertising', type: 'expense', normal: 'debit' },
    { number: '6800', name: 'Court Costs (Non-Billable)', type: 'expense', normal: 'debit' },
    { number: '6900', name: 'Expert Witness Fees (Non-Billable)', type: 'expense', normal: 'debit' },
    { number: '7000', name: 'Depreciation Expense', type: 'expense', normal: 'debit' },
  ],
  corporate: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - Client Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Transactional', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Retainer', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - M&A', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
  solo: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Owner Equity', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Owner Draws', type: 'equity', normal: 'debit' },
    { number: '4000', name: 'Legal Fees', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Contract Labor', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Office Expenses', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
}

export async function initializeChartOfAccounts(
  organizationId: string,
  template: keyof typeof ACCOUNT_TEMPLATES
) {
  const accounts = ACCOUNT_TEMPLATES[template]
  
  const created = await prisma.chartOfAccount.createMany({
    data: accounts.map((a) => ({
      organizationId,
      accountNumber: a.number,
      accountName: a.name,
      accountType: a.type,
      normalBalance: a.normal,
      currency: 'USD',
      isActive: true,
    })),
    skipDuplicates: true,
  })

  return created
}
