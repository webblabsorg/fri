import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { getExchangeRate } from './exchange-rate-service'
import { logDataEvent, extractRequestMetadata } from '@/lib/audit'

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

export interface CreateAccountOptions {
  createdBy?: string
  ipAddress?: string
  userAgent?: string
}

export async function createAccount(input: CreateAccountInput, options?: CreateAccountOptions) {
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

  // Audit log
  if (options?.createdBy) {
    try {
      await logDataEvent('chart_of_account_created', {
        organizationId: input.organizationId,
        userId: options.createdBy,
        resourceType: 'chart_of_account',
        resourceId: account.id,
        action: 'create',
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        details: {
          accountNumber: input.accountNumber,
          accountName: input.accountName,
          accountType: input.accountType,
          parentId: input.parentId,
        },
      })
    } catch (err) {
      console.warn('Failed to log audit event:', err)
    }
  }

  return account
}

export async function getAccounts(organizationId: string, options?: {
  accountType?: string
  isActive?: boolean
  includeHierarchy?: boolean
  rootOnly?: boolean
}) {
  const where: Record<string, unknown> = { organizationId }
  
  if (options?.accountType) {
    where.accountType = options.accountType
  }
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive
  }
  if (options?.rootOnly) {
    where.parentId = null
  }

  const accounts = await prisma.chartOfAccount.findMany({
    where,
    include: options?.includeHierarchy ? {
      parent: true,
      children: true,
    } : undefined,
    orderBy: { accountNumber: 'asc' },
  })

  // If hierarchy requested, build full tree recursively
  if (options?.includeHierarchy && options?.rootOnly) {
    return buildAccountTree(accounts, organizationId)
  }

  return accounts
}

/**
 * Recursively build account tree with unlimited depth
 */
async function buildAccountTree(
  accounts: Array<{ id: string; children?: Array<{ id: string }> } & Record<string, unknown>>,
  organizationId: string,
  depth = 0,
  maxDepth = 20
): Promise<Array<Record<string, unknown>>> {
  if (depth >= maxDepth) return accounts

  const result = []
  for (const account of accounts) {
    const children = await prisma.chartOfAccount.findMany({
      where: { organizationId, parentId: account.id },
      orderBy: { accountNumber: 'asc' },
    })

    if (children.length > 0) {
      const nestedChildren = await buildAccountTree(children, organizationId, depth + 1, maxDepth)
      result.push({ ...account, children: nestedChildren, depth })
    } else {
      result.push({ ...account, children: [], depth })
    }
  }
  return result
}

/**
 * Get flattened account list with hierarchy info (for dropdowns/reports)
 */
export async function getAccountsFlat(organizationId: string, options?: {
  accountType?: string
  isActive?: boolean
}): Promise<Array<{
  id: string
  accountNumber: string
  accountName: string
  accountType: string
  depth: number
  path: string
  fullName: string
}>> {
  const where: Record<string, unknown> = { organizationId }
  if (options?.accountType) where.accountType = options.accountType
  if (options?.isActive !== undefined) where.isActive = options.isActive

  const accounts = await prisma.chartOfAccount.findMany({
    where,
    include: { parent: true },
    orderBy: { accountNumber: 'asc' },
  })

  // Build path for each account
  const accountMap = new Map(accounts.map(a => [a.id, a]))
  
  function getPath(account: typeof accounts[0]): string[] {
    const path: string[] = [account.accountNumber]
    let current = account
    while (current.parentId && accountMap.has(current.parentId)) {
      current = accountMap.get(current.parentId)!
      path.unshift(current.accountNumber)
    }
    return path
  }

  function getDepth(account: typeof accounts[0]): number {
    let depth = 0
    let current = account
    while (current.parentId && accountMap.has(current.parentId)) {
      current = accountMap.get(current.parentId)!
      depth++
    }
    return depth
  }

  return accounts.map(a => ({
    id: a.id,
    accountNumber: a.accountNumber,
    accountName: a.accountName,
    accountType: a.accountType,
    depth: getDepth(a),
    path: getPath(a).join(' > '),
    fullName: getPath(a).length > 1 
      ? `${'  '.repeat(getDepth(a))}${a.accountNumber} - ${a.accountName}`
      : `${a.accountNumber} - ${a.accountName}`,
  }))
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

export interface UpdateAccountOptions {
  updatedBy?: string
  ipAddress?: string
  userAgent?: string
}

export async function updateAccount(
  id: string, 
  organizationId: string, 
  input: UpdateAccountInput,
  options?: UpdateAccountOptions
) {
  const account = await prisma.chartOfAccount.update({
    where: { id },
    data: input,
  })

  // Audit log
  if (options?.updatedBy) {
    try {
      await logDataEvent('chart_of_account_updated', {
        organizationId,
        userId: options.updatedBy,
        resourceType: 'chart_of_account',
        resourceId: id,
        action: 'update',
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        details: { changes: input },
      })
    } catch (err) {
      console.warn('Failed to log audit event:', err)
    }
  }

  return account
}

export interface DeactivateAccountOptions {
  deactivatedBy?: string
  ipAddress?: string
  userAgent?: string
}

export async function deactivateAccount(
  id: string, 
  organizationId: string,
  options?: DeactivateAccountOptions
) {
  const account = await prisma.chartOfAccount.findFirst({
    where: { id, organizationId },
    include: { transactions: { take: 1 } },
  })

  if (!account) {
    throw new Error('Account not found')
  }

  let result
  let action: 'update' | 'delete' = 'update'

  if (account.transactions.length > 0) {
    result = await prisma.chartOfAccount.update({
      where: { id },
      data: { isActive: false },
    })
  } else {
    result = await prisma.chartOfAccount.delete({ where: { id } })
    action = 'delete'
  }

  // Audit log
  if (options?.deactivatedBy) {
    try {
      await logDataEvent('chart_of_account_deactivated', {
        organizationId,
        userId: options.deactivatedBy,
        resourceType: 'chart_of_account',
        resourceId: id,
        action,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        details: {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          hadTransactions: account.transactions.length > 0,
        },
      })
    } catch (err) {
      console.warn('Failed to log audit event:', err)
    }
  }

  return result
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
  currency?: string
}

export interface CreateJournalEntryInput {
  organizationId: string
  journalType: 'standard' | 'adjusting' | 'closing' | 'reversing'
  description: string
  postedDate: Date
  entries: JournalEntryLineInput[]
  createdBy: string
  baseCurrency?: string
  sourceType?: string
  sourceId?: string
  autoPost?: boolean
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
  const baseCurrency = input.baseCurrency || 'USD'
  
  // Check for idempotency - if sourceType and sourceId provided, check if JE already exists
  if (input.sourceType && input.sourceId) {
    const existing = await prisma.generalLedgerEntry.findFirst({
      where: {
        organizationId: input.organizationId,
        referenceType: input.sourceType,
        referenceId: input.sourceId,
      },
      include: { journal: true },
    })
    if (existing?.journal) {
      return existing.journal
    }
  }

  // Process entries with multi-currency support
  const processedEntries = await Promise.all(
    input.entries.map(async (entry) => {
      const entryCurrency = entry.currency || baseCurrency
      let exchangeRate = 1
      let baseCurrencyDebit = entry.debit
      let baseCurrencyCredit = entry.credit

      if (entryCurrency !== baseCurrency) {
        exchangeRate = await getExchangeRate(entryCurrency, baseCurrency)
        baseCurrencyDebit = entry.debit * exchangeRate
        baseCurrencyCredit = entry.credit * exchangeRate
      }

      return {
        ...entry,
        currency: entryCurrency,
        exchangeRate,
        baseCurrencyDebit,
        baseCurrencyCredit,
      }
    })
  )

  // Validate balance using base currency amounts
  const totalDebit = processedEntries.reduce((sum, e) => sum + e.baseCurrencyDebit, 0)
  const totalCredit = processedEntries.reduce((sum, e) => sum + e.baseCurrencyCredit, 0)

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
      status: input.autoPost ? 'posted' : 'draft',
      totalDebit: new Decimal(totalDebit),
      totalCredit: new Decimal(totalCredit),
      createdBy: input.createdBy,
      approvedBy: input.autoPost ? input.createdBy : undefined,
      approvedAt: input.autoPost ? new Date() : undefined,
      entries: {
        create: processedEntries.map((entry) => ({
          organizationId: input.organizationId,
          accountId: entry.accountId,
          debit: new Decimal(entry.debit),
          credit: new Decimal(entry.credit),
          description: entry.description,
          referenceId: entry.referenceId || input.sourceId,
          referenceType: entry.referenceType || input.sourceType,
          currency: entry.currency,
          exchangeRate: new Decimal(entry.exchangeRate),
          baseCurrencyAmount: new Decimal(entry.baseCurrencyDebit - entry.baseCurrencyCredit),
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

  // Audit log
  try {
    await logDataEvent('journal_entry_created', {
      organizationId: input.organizationId,
      userId: input.createdBy,
      resourceType: 'journal_entry',
      resourceId: journalEntry.id,
      action: 'create',
      details: {
        journalNumber,
        journalType: input.journalType,
        totalDebit,
        totalCredit,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        autoPosted: input.autoPost,
      },
    })
  } catch (err) {
    console.warn('Failed to log audit event:', err)
  }

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
  // LITIGATION & TRIAL PRACTICE
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
  // CORPORATE & BUSINESS LAW
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
  // SOLO PRACTITIONER
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
  // FAMILY LAW PRACTICE
  family: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2200', name: 'Retainer Deposits', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Divorce', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Custody', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - Support', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Legal Fees - Mediation', type: 'revenue', normal: 'credit' },
    { number: '4400', name: 'Reimbursed Expenses', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'Mediator Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Guardian Ad Litem Fees', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
  // REAL ESTATE LAW
  realEstate: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - Escrow Trust', type: 'asset', normal: 'debit' },
    { number: '1020', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Escrow Liability', type: 'liability', normal: 'credit' },
    { number: '2110', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Closings', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Title Work', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - Commercial', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Title Insurance Commissions', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'Title Search Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Recording Fees', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
  // CRIMINAL DEFENSE
  criminal: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2200', name: 'Unearned Retainers', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Misdemeanor', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Felony', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - DUI/DWI', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Legal Fees - Appeals', type: 'revenue', normal: 'credit' },
    { number: '4400', name: 'Court-Appointed Fees', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'Investigator Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Expert Witness Fees', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
  // IMMIGRATION LAW
  immigration: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2200', name: 'Filing Fee Deposits', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Family Petitions', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Employment Visas', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - Naturalization', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Legal Fees - Asylum', type: 'revenue', normal: 'credit' },
    { number: '4400', name: 'Legal Fees - Removal Defense', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'USCIS Filing Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Translation Services', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
  // INTELLECTUAL PROPERTY
  intellectualProperty: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - Client Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2200', name: 'Filing Fee Deposits', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Patent Prosecution', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Trademark', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - Copyright', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Legal Fees - IP Litigation', type: 'revenue', normal: 'credit' },
    { number: '4400', name: 'Legal Fees - Licensing', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'USPTO Filing Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Patent Search Services', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
  // BANKRUPTCY & RESTRUCTURING
  bankruptcy: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2200', name: 'Court Filing Fee Deposits', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Chapter 7', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Chapter 13', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - Chapter 11', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Legal Fees - Creditor Representation', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'Court Filing Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Credit Counseling Fees', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
  // PERSONAL INJURY / CONTINGENCY
  personalInjury: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - Settlement Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Case Costs Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Contingency Fees Receivable', type: 'asset', normal: 'debit' },
    { number: '1300', name: 'Case Cost Advances', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Settlement Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2200', name: 'Medical Lien Payables', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Contingency Fees - Auto Accidents', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Contingency Fees - Premises Liability', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Contingency Fees - Medical Malpractice', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Contingency Fees - Product Liability', type: 'revenue', normal: 'credit' },
    { number: '4400', name: 'Case Cost Reimbursements', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'Medical Records Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Expert Witness Fees', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
    { number: '6700', name: 'Case Advertising', type: 'expense', normal: 'debit' },
  ],
  // ESTATE PLANNING & PROBATE
  estatePlanning: [
    { number: '1000', name: 'Cash - Operating', type: 'asset', normal: 'debit' },
    { number: '1010', name: 'Cash - IOLTA Trust', type: 'asset', normal: 'debit' },
    { number: '1020', name: 'Cash - Estate Trust', type: 'asset', normal: 'debit' },
    { number: '1100', name: 'Accounts Receivable', type: 'asset', normal: 'debit' },
    { number: '1200', name: 'Unbilled Time', type: 'asset', normal: 'debit' },
    { number: '2000', name: 'Accounts Payable', type: 'liability', normal: 'credit' },
    { number: '2100', name: 'Client Trust Liability', type: 'liability', normal: 'credit' },
    { number: '2110', name: 'Estate Trust Liability', type: 'liability', normal: 'credit' },
    { number: '3000', name: 'Partner Capital', type: 'equity', normal: 'credit' },
    { number: '3100', name: 'Retained Earnings', type: 'equity', normal: 'credit' },
    { number: '4000', name: 'Legal Fees - Estate Planning', type: 'revenue', normal: 'credit' },
    { number: '4100', name: 'Legal Fees - Probate', type: 'revenue', normal: 'credit' },
    { number: '4200', name: 'Legal Fees - Trust Administration', type: 'revenue', normal: 'credit' },
    { number: '4300', name: 'Legal Fees - Guardianship', type: 'revenue', normal: 'credit' },
    { number: '5000', name: 'Salaries & Wages', type: 'expense', normal: 'debit' },
    { number: '6000', name: 'Rent', type: 'expense', normal: 'debit' },
    { number: '6300', name: 'Court Filing Fees', type: 'expense', normal: 'debit' },
    { number: '6400', name: 'Appraisal Fees', type: 'expense', normal: 'debit' },
    { number: '6500', name: 'Malpractice Insurance', type: 'expense', normal: 'debit' },
    { number: '6600', name: 'Technology & Software', type: 'expense', normal: 'debit' },
  ],
}

/**
 * Get list of available chart of accounts templates
 */
export function getAvailableTemplates(): Array<{ key: string; name: string; description: string }> {
  return [
    { key: 'litigation', name: 'Litigation & Trial Practice', description: 'For civil litigation, trials, and dispute resolution' },
    { key: 'corporate', name: 'Corporate & Business Law', description: 'For transactional, M&A, and business advisory' },
    { key: 'solo', name: 'Solo Practitioner', description: 'Simplified chart for solo practices' },
    { key: 'family', name: 'Family Law', description: 'For divorce, custody, and family matters' },
    { key: 'realEstate', name: 'Real Estate Law', description: 'For closings, title work, and property transactions' },
    { key: 'criminal', name: 'Criminal Defense', description: 'For criminal defense and DUI practices' },
    { key: 'immigration', name: 'Immigration Law', description: 'For visa, naturalization, and immigration matters' },
    { key: 'intellectualProperty', name: 'Intellectual Property', description: 'For patents, trademarks, and IP litigation' },
    { key: 'bankruptcy', name: 'Bankruptcy & Restructuring', description: 'For Chapter 7, 11, 13 and creditor work' },
    { key: 'personalInjury', name: 'Personal Injury / Contingency', description: 'For PI, med mal, and contingency practices' },
    { key: 'estatePlanning', name: 'Estate Planning & Probate', description: 'For wills, trusts, and probate administration' },
  ]
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
