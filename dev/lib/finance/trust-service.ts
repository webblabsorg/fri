import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { createTrustDepositJournalEntry, createTrustDisbursementJournalEntry } from './accounting-automation'

// ============================================================================
// TRUST ACCOUNT SERVICE
// ============================================================================

export interface CreateTrustAccountInput {
  organizationId: string
  accountName: string
  bankName: string
  accountNumber: string
  routingNumber?: string
  accountType?: 'IOLTA' | 'client_trust' | 'escrow'
  currency?: string
  jurisdiction: string
  stateBarId?: string
  interestRate?: number
}

export async function createTrustAccount(input: CreateTrustAccountInput) {
  return prisma.trustAccount.create({
    data: {
      organizationId: input.organizationId,
      accountName: input.accountName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      routingNumber: input.routingNumber,
      accountType: input.accountType || 'IOLTA',
      currency: input.currency || 'USD',
      jurisdiction: input.jurisdiction,
      stateBarId: input.stateBarId,
      interestRate: input.interestRate ? new Decimal(input.interestRate) : null,
      currentBalance: new Decimal(0),
      isActive: true,
    },
  })
}

export async function getTrustAccounts(organizationId: string, options?: {
  isActive?: boolean
  jurisdiction?: string
}) {
  const where: Record<string, unknown> = { organizationId }
  
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive
  }
  if (options?.jurisdiction) {
    where.jurisdiction = options.jurisdiction
  }

  return prisma.trustAccount.findMany({
    where,
    include: {
      _count: {
        select: {
          clientLedgers: true,
          transactions: true,
        },
      },
    },
    orderBy: { accountName: 'asc' },
  })
}

export async function getTrustAccountById(id: string, organizationId: string) {
  return prisma.trustAccount.findFirst({
    where: { id, organizationId },
    include: {
      clientLedgers: {
        include: { client: true, matter: true },
        orderBy: { ledgerName: 'asc' },
      },
      _count: {
        select: { transactions: true, reconciliations: true },
      },
    },
  })
}

export async function updateTrustAccount(
  id: string,
  organizationId: string,
  data: Partial<CreateTrustAccountInput>
) {
  return prisma.trustAccount.update({
    where: { id },
    data: {
      accountName: data.accountName,
      bankName: data.bankName,
      jurisdiction: data.jurisdiction,
      stateBarId: data.stateBarId,
      interestRate: data.interestRate ? new Decimal(data.interestRate) : undefined,
    },
  })
}

export async function deactivateTrustAccount(id: string, organizationId: string) {
  const account = await prisma.trustAccount.findFirst({
    where: { id, organizationId },
  })

  if (!account) {
    throw new Error('Trust account not found')
  }

  if (Number(account.currentBalance) !== 0) {
    throw new Error('Cannot deactivate account with non-zero balance')
  }

  return prisma.trustAccount.update({
    where: { id },
    data: { isActive: false },
  })
}

// ============================================================================
// CLIENT TRUST LEDGER SERVICE
// ============================================================================

export interface CreateClientLedgerInput {
  trustAccountId: string
  clientId: string
  matterId?: string
  ledgerName: string
}

export async function createClientLedger(input: CreateClientLedgerInput) {
  const trustAccount = await prisma.trustAccount.findUnique({
    where: { id: input.trustAccountId },
  })

  if (!trustAccount) {
    throw new Error('Trust account not found')
  }

  return prisma.clientTrustLedger.create({
    data: {
      trustAccountId: input.trustAccountId,
      clientId: input.clientId,
      matterId: input.matterId,
      ledgerName: input.ledgerName,
      balance: new Decimal(0),
      currency: trustAccount.currency,
      status: 'active',
    },
    include: {
      client: true,
      matter: true,
    },
  })
}

export async function getClientLedgers(trustAccountId: string, options?: {
  status?: string
  clientId?: string
}) {
  const where: Record<string, unknown> = { trustAccountId }

  if (options?.status) {
    where.status = options.status
  }
  if (options?.clientId) {
    where.clientId = options.clientId
  }

  return prisma.clientTrustLedger.findMany({
    where,
    include: {
      client: true,
      matter: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { ledgerName: 'asc' },
  })
}

export async function getClientLedgerById(id: string) {
  return prisma.clientTrustLedger.findUnique({
    where: { id },
    include: {
      client: true,
      matter: true,
      trustAccount: true,
      transactions: {
        orderBy: { transactionDate: 'desc' },
        take: 100,
      },
    },
  })
}

export async function getLedgerTransactions(ledgerId: string, options?: {
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = { clientLedgerId: ledgerId }

  if (options?.startDate || options?.endDate) {
    where.transactionDate = {}
    if (options?.startDate) {
      (where.transactionDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.transactionDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.trustTransaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.trustTransaction.count({ where }),
  ])

  return { transactions, total }
}

// ============================================================================
// TRUST TRANSACTION SERVICE
// ============================================================================

export interface AuditContext {
  ipAddress?: string
  userAgent?: string
}

export interface CreateTrustTransactionInput {
  trustAccountId: string
  clientLedgerId: string
  transactionType: 'deposit' | 'transfer_to_operating' | 'disbursement' | 'refund' | 'interest'
  amount: number
  description: string
  paymentMethod?: string
  checkNumber?: string
  referenceNumber?: string
  payee?: string
  fromAccount?: string
  toAccount?: string
  transactionDate: Date
  createdBy: string
  auditContext?: AuditContext
}

export async function createTrustTransaction(input: CreateTrustTransactionInput) {
  const ledger = await prisma.clientTrustLedger.findUnique({
    where: { id: input.clientLedgerId },
    include: { trustAccount: true },
  })

  if (!ledger) {
    throw new Error('Client ledger not found')
  }

  const isDebit = ['transfer_to_operating', 'disbursement', 'refund'].includes(input.transactionType)
  const currentBalance = Number(ledger.balance)
  const newBalance = isDebit ? currentBalance - input.amount : currentBalance + input.amount

  if (isDebit && newBalance < 0) {
    throw new Error('Insufficient funds: transaction would result in negative balance')
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const txn = await tx.trustTransaction.create({
      data: {
        trustAccountId: input.trustAccountId,
        clientLedgerId: input.clientLedgerId,
        transactionType: input.transactionType,
        amount: new Decimal(input.amount),
        runningBalance: new Decimal(newBalance),
        currency: ledger.currency,
        description: input.description,
        paymentMethod: input.paymentMethod,
        checkNumber: input.checkNumber,
        referenceNumber: input.referenceNumber,
        payee: input.payee,
        fromAccount: input.fromAccount,
        toAccount: input.toAccount,
        transactionDate: input.transactionDate,
        createdBy: input.createdBy,
      },
    })

    await tx.clientTrustLedger.update({
      where: { id: input.clientLedgerId },
      data: {
        balance: new Decimal(newBalance),
        lastActivityAt: new Date(),
        status: 'active',
        dormantSince: null,
      },
    })

    const trustAccountBalance = Number(ledger.trustAccount.currentBalance)
    const newTrustBalance = isDebit
      ? trustAccountBalance - input.amount
      : trustAccountBalance + input.amount

    await tx.trustAccount.update({
      where: { id: input.trustAccountId },
      data: { currentBalance: new Decimal(newTrustBalance) },
    })

    await tx.trustAuditLog.create({
      data: {
        trustTransactionId: txn.id,
        eventType: 'created',
        eventData: {
          transactionType: input.transactionType,
          amount: input.amount,
          description: input.description,
          previousBalance: currentBalance,
          newBalance,
        },
        userId: input.createdBy,
        ipAddress: input.auditContext?.ipAddress || null,
        userAgent: input.auditContext?.userAgent || null,
      },
    })

    return txn
  })

  // Create accounting journal entry for trust transaction
  try {
    const isDeposit = ['deposit', 'interest'].includes(input.transactionType)
    if (isDeposit) {
      await createTrustDepositJournalEntry(
        ledger.trustAccount.organizationId,
        transaction.id,
        ledger.clientId,
        input.amount,
        input.createdBy
      )
    } else {
      await createTrustDisbursementJournalEntry(
        ledger.trustAccount.organizationId,
        transaction.id,
        ledger.clientId,
        input.amount,
        input.createdBy
      )
    }
  } catch (err) {
    console.warn('Failed to create trust transaction journal entry:', err)
  }

  return transaction
}

export async function getTrustTransactions(organizationId: string, options?: {
  trustAccountId?: string
  clientLedgerId?: string
  transactionType?: string
  startDate?: Date
  endDate?: Date
  isReconciled?: boolean
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = {
    trustAccount: { organizationId },
  }

  if (options?.trustAccountId) {
    where.trustAccountId = options.trustAccountId
  }
  if (options?.clientLedgerId) {
    where.clientLedgerId = options.clientLedgerId
  }
  if (options?.transactionType) {
    where.transactionType = options.transactionType
  }
  if (options?.isReconciled !== undefined) {
    where.isReconciled = options.isReconciled
  }
  if (options?.startDate || options?.endDate) {
    where.transactionDate = {}
    if (options?.startDate) {
      (where.transactionDate as Record<string, Date>).gte = options.startDate
    }
    if (options?.endDate) {
      (where.transactionDate as Record<string, Date>).lte = options.endDate
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.trustTransaction.findMany({
      where,
      include: {
        clientLedger: { include: { client: true } },
        trustAccount: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.trustTransaction.count({ where }),
  ])

  return { transactions, total }
}

export async function getTrustTransactionById(id: string) {
  return prisma.trustTransaction.findUnique({
    where: { id },
    include: {
      clientLedger: { include: { client: true, matter: true } },
      trustAccount: true,
      auditLogs: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function voidTrustTransaction(
  id: string,
  voidedBy: string,
  voidReason: string,
  auditContext?: AuditContext
) {
  const transaction = await prisma.trustTransaction.findUnique({
    where: { id },
    include: { clientLedger: true, trustAccount: true },
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.voidedAt) {
    throw new Error('Transaction already voided')
  }

  if (transaction.isReconciled) {
    throw new Error('Cannot void reconciled transaction')
  }

  const isDebit = ['transfer_to_operating', 'disbursement', 'refund'].includes(
    transaction.transactionType
  )
  const amount = Number(transaction.amount)
  const currentLedgerBalance = Number(transaction.clientLedger.balance)
  const currentTrustBalance = Number(transaction.trustAccount.currentBalance)

  const newLedgerBalance = isDebit
    ? currentLedgerBalance + amount
    : currentLedgerBalance - amount
  const newTrustBalance = isDebit
    ? currentTrustBalance + amount
    : currentTrustBalance - amount

  await prisma.$transaction(async (tx) => {
    await tx.trustTransaction.update({
      where: { id },
      data: {
        voidedAt: new Date(),
        voidedBy,
        voidReason,
      },
    })

    await tx.clientTrustLedger.update({
      where: { id: transaction.clientLedgerId },
      data: { balance: new Decimal(newLedgerBalance) },
    })

    await tx.trustAccount.update({
      where: { id: transaction.trustAccountId },
      data: { currentBalance: new Decimal(newTrustBalance) },
    })

    await tx.trustAuditLog.create({
      data: {
        trustTransactionId: id,
        eventType: 'voided',
        eventData: {
          voidReason,
          previousLedgerBalance: currentLedgerBalance,
          newLedgerBalance,
        },
        userId: voidedBy,
        ipAddress: auditContext?.ipAddress || null,
        userAgent: auditContext?.userAgent || null,
      },
    })
  })
}

export async function approveTrustTransaction(
  id: string,
  approvedBy: string,
  auditContext?: AuditContext
) {
  const transaction = await prisma.trustTransaction.findUnique({
    where: { id },
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.approvedAt) {
    throw new Error('Transaction already approved')
  }

  await prisma.$transaction(async (tx) => {
    await tx.trustTransaction.update({
      where: { id },
      data: {
        approvedBy,
        approvedAt: new Date(),
      },
    })

    await tx.trustAuditLog.create({
      data: {
        trustTransactionId: id,
        eventType: 'approved',
        eventData: { approvedBy },
        userId: approvedBy,
        ipAddress: auditContext?.ipAddress || null,
        userAgent: auditContext?.userAgent || null,
      },
    })
  })
}

// ============================================================================
// THREE-WAY RECONCILIATION SERVICE
// ============================================================================

export interface StartReconciliationInput {
  trustAccountId: string
  periodStart: Date
  periodEnd: Date
  bankBalance: number
  reconciledBy: string
}

export async function startReconciliation(input: StartReconciliationInput) {
  const trustAccount = await prisma.trustAccount.findUnique({
    where: { id: input.trustAccountId },
    include: {
      clientLedgers: true,
      transactions: {
        where: {
          transactionDate: { gte: input.periodStart, lte: input.periodEnd },
          voidedAt: null,
        },
      },
    },
  })

  if (!trustAccount) {
    throw new Error('Trust account not found')
  }

  const trustLedgerBalance = Number(trustAccount.currentBalance)
  const clientLedgersTotal = trustAccount.clientLedgers.reduce(
    (sum, l) => sum + Number(l.balance),
    0
  )

  const outstandingDeposits = trustAccount.transactions
    .filter((t) => !t.isCleared && ['deposit', 'interest'].includes(t.transactionType))
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const outstandingChecks = trustAccount.transactions
    .filter(
      (t) =>
        !t.isCleared &&
        ['transfer_to_operating', 'disbursement', 'refund'].includes(t.transactionType)
    )
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const adjustedBankBalance =
    input.bankBalance + outstandingDeposits - outstandingChecks

  const discrepancy = Math.abs(adjustedBankBalance - trustLedgerBalance)
  const isBalanced = discrepancy < 0.01

  const threeWayDiscrepancy = Math.abs(trustLedgerBalance - clientLedgersTotal)
  const threeWayBalanced = threeWayDiscrepancy < 0.01

  return prisma.trustReconciliation.create({
    data: {
      trustAccountId: input.trustAccountId,
      reconciliationDate: new Date(),
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      bankBalance: new Decimal(input.bankBalance),
      trustLedgerBalance: new Decimal(trustLedgerBalance),
      clientLedgersTotal: new Decimal(clientLedgersTotal),
      outstandingDeposits: new Decimal(outstandingDeposits),
      outstandingChecks: new Decimal(outstandingChecks),
      adjustedBankBalance: new Decimal(adjustedBankBalance),
      isBalanced: isBalanced && threeWayBalanced,
      discrepancy: isBalanced ? null : new Decimal(discrepancy),
      discrepancyNotes: !threeWayBalanced
        ? `Three-way reconciliation discrepancy: Trust ledger (${trustLedgerBalance}) vs Client ledgers (${clientLedgersTotal})`
        : null,
      status: 'draft',
      reconciledBy: input.reconciledBy,
    },
  })
}

export async function getReconciliations(organizationId: string, options?: {
  trustAccountId?: string
  status?: string
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = {
    trustAccount: { organizationId },
  }

  if (options?.trustAccountId) {
    where.trustAccountId = options.trustAccountId
  }
  if (options?.status) {
    where.status = options.status
  }

  const [reconciliations, total] = await Promise.all([
    prisma.trustReconciliation.findMany({
      where,
      include: { trustAccount: true },
      orderBy: { reconciliationDate: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.trustReconciliation.count({ where }),
  ])

  return { reconciliations, total }
}

export async function getReconciliationById(id: string) {
  return prisma.trustReconciliation.findUnique({
    where: { id },
    include: {
      trustAccount: {
        include: { clientLedgers: { include: { client: true } } },
      },
      bankStatement: { include: { transactions: true } },
    },
  })
}

export async function completeReconciliation(id: string, notes?: string) {
  const reconciliation = await prisma.trustReconciliation.findUnique({
    where: { id },
  })

  if (!reconciliation) {
    throw new Error('Reconciliation not found')
  }

  if (!reconciliation.isBalanced) {
    throw new Error('Cannot complete unbalanced reconciliation')
  }

  return prisma.$transaction(async (tx) => {
    await tx.trustReconciliation.update({
      where: { id },
      data: {
        status: 'completed',
        notes,
      },
    })

    await tx.trustTransaction.updateMany({
      where: {
        trustAccountId: reconciliation.trustAccountId,
        transactionDate: {
          gte: reconciliation.periodStart,
          lte: reconciliation.periodEnd,
        },
        isReconciled: false,
        voidedAt: null,
      },
      data: {
        isReconciled: true,
        reconciledDate: new Date(),
        reconciledBy: reconciliation.reconciledBy,
      },
    })

    await tx.trustAccount.update({
      where: { id: reconciliation.trustAccountId },
      data: {
        lastReconciledBalance: reconciliation.trustLedgerBalance,
        lastReconciledDate: new Date(),
      },
    })

    return tx.trustReconciliation.findUnique({ where: { id } })
  })
}

export async function approveReconciliation(id: string, approvedBy: string) {
  const reconciliation = await prisma.trustReconciliation.findUnique({
    where: { id },
  })

  if (!reconciliation) {
    throw new Error('Reconciliation not found')
  }

  if (reconciliation.status !== 'completed') {
    throw new Error('Reconciliation must be completed before approval')
  }

  return prisma.trustReconciliation.update({
    where: { id },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    },
  })
}

// ============================================================================
// COMPLIANCE CHECKS
// ============================================================================

export interface ComplianceAlert {
  type: 'negative_balance' | 'commingling' | 'dormant' | 'missing_reconciliation' | 'unusual_activity'
  severity: 'critical' | 'warning' | 'info'
  message: string
  entityId: string
  entityType: 'ledger' | 'account' | 'transaction'
  details?: Record<string, unknown>
}

export async function runComplianceCheck(organizationId: string): Promise<ComplianceAlert[]> {
  const alerts: ComplianceAlert[] = []

  const ledgers = await prisma.clientTrustLedger.findMany({
    where: { trustAccount: { organizationId } },
    include: { trustAccount: true, client: true },
  })

  for (const ledger of ledgers) {
    if (Number(ledger.balance) < 0) {
      alerts.push({
        type: 'negative_balance',
        severity: 'critical',
        message: `Negative balance detected: ${ledger.ledgerName} has balance of $${ledger.balance}`,
        entityId: ledger.id,
        entityType: 'ledger',
        details: { balance: Number(ledger.balance), clientName: ledger.client.displayName },
      })
    }

    const dormantThreshold = new Date()
    dormantThreshold.setMonth(dormantThreshold.getMonth() - 12)

    if (
      ledger.lastActivityAt &&
      ledger.lastActivityAt < dormantThreshold &&
      Number(ledger.balance) > 0
    ) {
      alerts.push({
        type: 'dormant',
        severity: 'warning',
        message: `Dormant account: ${ledger.ledgerName} has had no activity for over 12 months`,
        entityId: ledger.id,
        entityType: 'ledger',
        details: {
          lastActivity: ledger.lastActivityAt,
          balance: Number(ledger.balance),
        },
      })
    }
  }

  const accounts = await prisma.trustAccount.findMany({
    where: { organizationId, isActive: true },
    include: { clientLedgers: true },
  })

  for (const account of accounts) {
    const clientTotal = account.clientLedgers.reduce(
      (sum, l) => sum + Number(l.balance),
      0
    )
    const accountBalance = Number(account.currentBalance)

    if (Math.abs(accountBalance - clientTotal) > 0.01) {
      alerts.push({
        type: 'commingling',
        severity: 'critical',
        message: `Potential commingling: ${account.accountName} balance ($${accountBalance}) doesn't match client ledgers total ($${clientTotal})`,
        entityId: account.id,
        entityType: 'account',
        details: { accountBalance, clientTotal, difference: accountBalance - clientTotal },
      })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (!account.lastReconciledDate || account.lastReconciledDate < thirtyDaysAgo) {
      alerts.push({
        type: 'missing_reconciliation',
        severity: 'warning',
        message: `Missing reconciliation: ${account.accountName} has not been reconciled in over 30 days`,
        entityId: account.id,
        entityType: 'account',
        details: { lastReconciled: account.lastReconciledDate },
      })
    }
  }

  return alerts
}

export async function getComplianceAlerts(organizationId: string) {
  return runComplianceCheck(organizationId)
}

// ============================================================================
// BANK STATEMENT SERVICE
// ============================================================================

export interface ImportBankStatementInput {
  trustAccountId: string
  statementDate: Date
  periodStart: Date
  periodEnd: Date
  openingBalance: number
  closingBalance: number
  fileUrl?: string
  format: 'csv' | 'ofx' | 'qfx'
  transactions: BankStatementTransactionInput[]
  importedBy: string
}

export interface BankStatementTransactionInput {
  transactionDate: Date
  description: string
  amount: number
  transactionType: 'debit' | 'credit'
  checkNumber?: string
  referenceNumber?: string
}

export async function importBankStatement(input: ImportBankStatementInput) {
  const trustAccount = await prisma.trustAccount.findUnique({
    where: { id: input.trustAccountId },
  })

  if (!trustAccount) {
    throw new Error('Trust account not found')
  }

  const totalDeposits = input.transactions
    .filter((t) => t.transactionType === 'credit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalWithdrawals = input.transactions
    .filter((t) => t.transactionType === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const statement = await prisma.bankStatement.create({
    data: {
      trustAccountId: input.trustAccountId,
      statementDate: input.statementDate,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      openingBalance: new Decimal(input.openingBalance),
      closingBalance: new Decimal(input.closingBalance),
      totalDeposits: new Decimal(totalDeposits),
      totalWithdrawals: new Decimal(totalWithdrawals),
      fileUrl: input.fileUrl,
      importedBy: input.importedBy,
      transactions: {
        create: input.transactions.map((t) => ({
          transactionDate: t.transactionDate,
          description: t.description,
          amount: new Decimal(t.amount),
          transactionType: t.transactionType,
          checkNumber: t.checkNumber,
          referenceNumber: t.referenceNumber,
          isMatched: false,
        })),
      },
    },
    include: {
      transactions: true,
    },
  })

  return statement
}

export async function listBankStatements(trustAccountId: string, options?: {
  limit?: number
  offset?: number
}) {
  const [statements, total] = await Promise.all([
    prisma.bankStatement.findMany({
      where: { trustAccountId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { statementDate: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.bankStatement.count({ where: { trustAccountId } }),
  ])

  return { statements, total }
}

export async function getBankStatementById(id: string) {
  return prisma.bankStatement.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { transactionDate: 'asc' } },
      trustAccount: true,
    },
  })
}

export async function autoMatchBankStatement(statementId: string) {
  const statement = await prisma.bankStatement.findUnique({
    where: { id: statementId },
    include: {
      transactions: { where: { isMatched: false } },
      trustAccount: true,
    },
  })

  if (!statement) {
    throw new Error('Bank statement not found')
  }

  const trustTransactions = await prisma.trustTransaction.findMany({
    where: {
      trustAccountId: statement.trustAccountId,
      transactionDate: {
        gte: statement.periodStart,
        lte: statement.periodEnd,
      },
      voidedAt: null,
    },
  })

  const matchResults: { bankTxnId: string; trustTxnId: string; confidence: number }[] = []

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const tokenSimilarity = (a: string, b: string) => {
    const aTokens = new Set(normalize(a).split(' ').filter(Boolean))
    const bTokens = new Set(normalize(b).split(' ').filter(Boolean))
    if (aTokens.size === 0 || bTokens.size === 0) return 0

    let intersection = 0
    for (const t of aTokens) {
      if (bTokens.has(t)) intersection++
    }
    const union = aTokens.size + bTokens.size - intersection
    return union === 0 ? 0 : intersection / union
  }

  const sameDayOrNear = (a: Date, b: Date) => {
    const diff = Math.abs(a.getTime() - b.getTime())
    const days = diff / (1000 * 60 * 60 * 24)
    return days <= 2
  }

  for (const bankTxn of statement.transactions) {
    let bestMatch: { id: string; confidence: number } | null = null

    for (const trustTxn of trustTransactions) {
      let confidence = 0

      const bankAmount = Math.abs(Number(bankTxn.amount))
      const trustAmount = Number(trustTxn.amount)
      if (Math.abs(bankAmount - trustAmount) < 0.01) {
        confidence += 40
      }

      const bankDate = new Date(bankTxn.transactionDate).toDateString()
      const trustDate = new Date(trustTxn.transactionDate).toDateString()
      if (bankDate === trustDate) {
        confidence += 30
      } else if (sameDayOrNear(new Date(bankTxn.transactionDate), new Date(trustTxn.transactionDate))) {
        confidence += 15
      }

      const descSim = tokenSimilarity(bankTxn.description, trustTxn.description)
      if (descSim >= 0.6) {
        confidence += 20
      } else if (descSim >= 0.3) {
        confidence += 10
      }

      if (bankTxn.checkNumber && trustTxn.checkNumber && 
          bankTxn.checkNumber === trustTxn.checkNumber) {
        confidence += 20
      }

      if (bankTxn.referenceNumber && trustTxn.referenceNumber &&
          bankTxn.referenceNumber === trustTxn.referenceNumber) {
        confidence += 10
      }

      if (confidence > 50 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { id: trustTxn.id, confidence }
      }
    }

    if (bestMatch) {
      matchResults.push({
        bankTxnId: bankTxn.id,
        trustTxnId: bestMatch.id,
        confidence: bestMatch.confidence,
      })
    }
  }

  for (const match of matchResults) {
    await prisma.bankStatementTransaction.update({
      where: { id: match.bankTxnId },
      data: {
        isMatched: true,
        matchedTransactionId: match.trustTxnId,
      },
    })
  }

  const updatedStatement = await prisma.bankStatement.findUnique({
    where: { id: statementId },
    include: {
      transactions: true,
    },
  })

  const matchedCount = updatedStatement?.transactions.filter((t) => t.isMatched).length || 0
  const totalCount = updatedStatement?.transactions.length || 0

  return {
    statement: updatedStatement,
    matchedCount,
    totalCount,
    matchRate: totalCount > 0 ? (matchedCount / totalCount) * 100 : 0,
    matches: matchResults,
  }
}

// ============================================================================
// TRUST REPORTS
// ============================================================================

export interface ClientLedgerReportOptions {
  organizationId: string
  trustAccountId?: string
  clientId?: string
  ledgerId?: string
  startDate?: Date
  endDate?: Date
}

export async function generateClientLedgerReport(options: ClientLedgerReportOptions) {
  const where: Record<string, unknown> = {
    trustAccount: { organizationId: options.organizationId },
  }

  if (options.trustAccountId) {
    where.trustAccountId = options.trustAccountId
  }
  if (options.clientId) {
    where.clientId = options.clientId
  }
  if (options.ledgerId) {
    where.id = options.ledgerId
  }

  const ledgers = await prisma.clientTrustLedger.findMany({
    where,
    include: {
      client: true,
      matter: true,
      trustAccount: true,
      transactions: {
        where: {
          voidedAt: null,
          ...(options.startDate || options.endDate
            ? {
                transactionDate: {
                  ...(options.startDate ? { gte: options.startDate } : {}),
                  ...(options.endDate ? { lte: options.endDate } : {}),
                },
              }
            : {}),
        },
        orderBy: { transactionDate: 'asc' },
      },
    },
    orderBy: { ledgerName: 'asc' },
  })

  const report = {
    generatedAt: new Date(),
    filters: options,
    summary: {
      totalLedgers: ledgers.length,
      totalBalance: ledgers.reduce((sum, l) => sum + Number(l.balance), 0),
      activeLedgers: ledgers.filter((l) => l.status === 'active').length,
      dormantLedgers: ledgers.filter((l) => l.status === 'dormant').length,
    },
    ledgers: ledgers.map((ledger) => ({
      id: ledger.id,
      ledgerName: ledger.ledgerName,
      clientName: ledger.client.displayName,
      matterName: ledger.matter?.name || null,
      trustAccountName: ledger.trustAccount.accountName,
      currentBalance: Number(ledger.balance),
      status: ledger.status,
      lastActivityAt: ledger.lastActivityAt,
      transactions: ledger.transactions.map((t) => ({
        id: t.id,
        date: t.transactionDate,
        type: t.transactionType,
        description: t.description,
        amount: Number(t.amount),
        runningBalance: Number(t.runningBalance),
        isReconciled: t.isReconciled,
      })),
      transactionCount: ledger.transactions.length,
      totalDeposits: ledger.transactions
        .filter((t) => ['deposit', 'interest'].includes(t.transactionType))
        .reduce((sum, t) => sum + Number(t.amount), 0),
      totalDisbursements: ledger.transactions
        .filter((t) => ['transfer_to_operating', 'disbursement', 'refund'].includes(t.transactionType))
        .reduce((sum, t) => sum + Number(t.amount), 0),
    })),
  }

  return report
}

export interface ReconciliationReportOptions {
  organizationId: string
  trustAccountId?: string
  reconciliationId?: string
  startDate?: Date
  endDate?: Date
}

export async function generateReconciliationReport(options: ReconciliationReportOptions) {
  const where: Record<string, unknown> = {
    trustAccount: { organizationId: options.organizationId },
  }

  if (options.trustAccountId) {
    where.trustAccountId = options.trustAccountId
  }
  if (options.reconciliationId) {
    where.id = options.reconciliationId
  }
  if (options.startDate || options.endDate) {
    where.reconciliationDate = {}
    if (options.startDate) {
      (where.reconciliationDate as Record<string, Date>).gte = options.startDate
    }
    if (options.endDate) {
      (where.reconciliationDate as Record<string, Date>).lte = options.endDate
    }
  }

  const reconciliations = await prisma.trustReconciliation.findMany({
    where,
    include: {
      trustAccount: {
        include: { clientLedgers: { include: { client: true } } },
      },
      bankStatement: true,
    },
    orderBy: { reconciliationDate: 'desc' },
  })

  const report = {
    generatedAt: new Date(),
    filters: options,
    summary: {
      totalReconciliations: reconciliations.length,
      balancedCount: reconciliations.filter((r) => r.isBalanced).length,
      unbalancedCount: reconciliations.filter((r) => !r.isBalanced).length,
      approvedCount: reconciliations.filter((r) => r.status === 'approved').length,
    },
    reconciliations: reconciliations.map((rec) => ({
      id: rec.id,
      trustAccountName: rec.trustAccount.accountName,
      reconciliationDate: rec.reconciliationDate,
      periodStart: rec.periodStart,
      periodEnd: rec.periodEnd,
      bankBalance: Number(rec.bankBalance),
      trustLedgerBalance: Number(rec.trustLedgerBalance),
      clientLedgersTotal: Number(rec.clientLedgersTotal),
      outstandingDeposits: Number(rec.outstandingDeposits),
      outstandingChecks: Number(rec.outstandingChecks),
      adjustedBankBalance: Number(rec.adjustedBankBalance),
      isBalanced: rec.isBalanced,
      discrepancy: rec.discrepancy ? Number(rec.discrepancy) : null,
      status: rec.status,
      reconciledBy: rec.reconciledBy,
      approvedBy: rec.approvedBy,
      approvedAt: rec.approvedAt,
      clientLedgers: rec.trustAccount.clientLedgers.map((l) => ({
        ledgerName: l.ledgerName,
        clientName: l.client.displayName,
        balance: Number(l.balance),
      })),
    })),
  }

  return report
}

export interface TransactionRegisterOptions {
  organizationId: string
  trustAccountId?: string
  clientLedgerId?: string
  transactionType?: string
  startDate?: Date
  endDate?: Date
  includeVoided?: boolean
}

export async function generateTransactionRegister(options: TransactionRegisterOptions) {
  const where: Record<string, unknown> = {
    trustAccount: { organizationId: options.organizationId },
  }

  if (options.trustAccountId) {
    where.trustAccountId = options.trustAccountId
  }
  if (options.clientLedgerId) {
    where.clientLedgerId = options.clientLedgerId
  }
  if (options.transactionType) {
    where.transactionType = options.transactionType
  }
  if (!options.includeVoided) {
    where.voidedAt = null
  }
  if (options.startDate || options.endDate) {
    where.transactionDate = {}
    if (options.startDate) {
      (where.transactionDate as Record<string, Date>).gte = options.startDate
    }
    if (options.endDate) {
      (where.transactionDate as Record<string, Date>).lte = options.endDate
    }
  }

  const transactions = await prisma.trustTransaction.findMany({
    where,
    include: {
      trustAccount: true,
      clientLedger: { include: { client: true, matter: true } },
    },
    orderBy: { transactionDate: 'asc' },
  })

  const totalDeposits = transactions
    .filter((t) => ['deposit', 'interest'].includes(t.transactionType) && !t.voidedAt)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalDisbursements = transactions
    .filter((t) => ['transfer_to_operating', 'disbursement', 'refund'].includes(t.transactionType) && !t.voidedAt)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const report = {
    generatedAt: new Date(),
    filters: options,
    summary: {
      totalTransactions: transactions.length,
      totalDeposits,
      totalDisbursements,
      netChange: totalDeposits - totalDisbursements,
      reconciledCount: transactions.filter((t) => t.isReconciled).length,
      unreconciledCount: transactions.filter((t) => !t.isReconciled && !t.voidedAt).length,
      voidedCount: transactions.filter((t) => t.voidedAt).length,
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.transactionDate,
      trustAccountName: t.trustAccount.accountName,
      clientName: t.clientLedger.client.displayName,
      matterName: t.clientLedger.matter?.name || null,
      ledgerName: t.clientLedger.ledgerName,
      type: t.transactionType,
      description: t.description,
      amount: Number(t.amount),
      runningBalance: Number(t.runningBalance),
      paymentMethod: t.paymentMethod,
      checkNumber: t.checkNumber,
      referenceNumber: t.referenceNumber,
      payee: t.payee,
      isReconciled: t.isReconciled,
      isVoided: !!t.voidedAt,
      voidReason: t.voidReason,
      createdBy: t.createdBy,
      approvedBy: t.approvedBy,
    })),
  }

  return report
}

// ============================================================================
// INTEREST DISTRIBUTION REPORT & CALCULATION
// ============================================================================

export interface InterestDistributionOptions {
  organizationId: string
  trustAccountId?: string
  periodStart: Date
  periodEnd: Date
  interestRate?: number // Override rate, otherwise use account's rate
}

export interface InterestAllocation {
  clientLedgerId: string
  clientName: string
  matterName: string | null
  averageDailyBalance: number
  daysInPeriod: number
  interestRate: number
  interestEarned: number
  percentageOfTotal: number
}

export interface InterestDistributionReport {
  generatedAt: Date
  periodStart: Date
  periodEnd: Date
  trustAccountId: string
  trustAccountName: string
  totalInterestEarned: number
  interestRate: number
  totalAverageDailyBalance: number
  allocations: InterestAllocation[]
  ioltaRemittance?: {
    recipientName: string
    amount: number
    remittanceDate: Date | null
  }
}

/**
 * Calculate interest distribution for trust account client ledgers
 * Uses average daily balance method for fair allocation
 */
export async function calculateInterestDistribution(
  options: InterestDistributionOptions
): Promise<InterestDistributionReport[]> {
  const where: Record<string, unknown> = {
    organizationId: options.organizationId,
    isActive: true,
  }
  if (options.trustAccountId) {
    where.id = options.trustAccountId
  }

  const trustAccounts = await prisma.trustAccount.findMany({
    where,
    include: {
      clientLedgers: {
        where: { status: 'active' },
        include: { client: true, matter: true },
      },
    },
  })

  const reports: InterestDistributionReport[] = []
  const daysInPeriod = Math.ceil(
    (options.periodEnd.getTime() - options.periodStart.getTime()) / (1000 * 60 * 60 * 24)
  )

  for (const account of trustAccounts) {
    const interestRate = options.interestRate ?? Number(account.interestRate ?? 0)
    if (interestRate <= 0) continue

    const allocations: InterestAllocation[] = []
    let totalADB = 0

    // Calculate average daily balance for each client ledger
    for (const ledger of account.clientLedgers) {
      const transactions = await prisma.trustTransaction.findMany({
        where: {
          clientLedgerId: ledger.id,
          transactionDate: { lte: options.periodEnd },
          voidedAt: null,
        },
        orderBy: { transactionDate: 'asc' },
      })

      // Calculate daily balances
      let runningBalance = 0
      let totalBalanceDays = 0
      let lastDate = options.periodStart

      for (const txn of transactions) {
        const txnDate = new Date(txn.transactionDate)
        if (txnDate > options.periodEnd) break

        // Days at previous balance
        if (txnDate >= options.periodStart) {
          const days = Math.max(0, Math.ceil((txnDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
          totalBalanceDays += runningBalance * days
          lastDate = txnDate
        }

        // Update running balance
        if (['deposit', 'interest', 'transfer_in'].includes(txn.transactionType)) {
          runningBalance += Number(txn.amount)
        } else {
          runningBalance -= Number(txn.amount)
        }
      }

      // Days from last transaction to period end
      const remainingDays = Math.max(0, Math.ceil((options.periodEnd.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
      totalBalanceDays += runningBalance * remainingDays

      const averageDailyBalance = daysInPeriod > 0 ? totalBalanceDays / daysInPeriod : 0
      totalADB += averageDailyBalance

      if (averageDailyBalance > 0) {
        allocations.push({
          clientLedgerId: ledger.id,
          clientName: ledger.client.displayName,
          matterName: ledger.matter?.name || null,
          averageDailyBalance,
          daysInPeriod,
          interestRate,
          interestEarned: 0, // Calculated after we have total
          percentageOfTotal: 0,
        })
      }
    }

    // Calculate interest earned and percentages
    const annualRate = interestRate / 100
    const periodRate = (annualRate * daysInPeriod) / 365
    const totalInterestEarned = totalADB * periodRate

    for (const alloc of allocations) {
      alloc.percentageOfTotal = totalADB > 0 ? (alloc.averageDailyBalance / totalADB) * 100 : 0
      alloc.interestEarned = totalInterestEarned * (alloc.percentageOfTotal / 100)
    }

    // IOLTA remittance (interest goes to state bar foundation)
    const ioltaRemittance = account.accountType === 'IOLTA' ? {
      recipientName: `${account.jurisdiction} Bar Foundation`,
      amount: totalInterestEarned,
      remittanceDate: null,
    } : undefined

    reports.push({
      generatedAt: new Date(),
      periodStart: options.periodStart,
      periodEnd: options.periodEnd,
      trustAccountId: account.id,
      trustAccountName: account.accountName,
      totalInterestEarned,
      interestRate,
      totalAverageDailyBalance: totalADB,
      allocations,
      ioltaRemittance,
    })
  }

  return reports
}

/**
 * Record interest distribution transactions
 */
export async function recordInterestDistribution(
  organizationId: string,
  trustAccountId: string,
  report: InterestDistributionReport,
  createdBy: string
): Promise<{ transactionIds: string[] }> {
  const transactionIds: string[] = []

  // For IOLTA accounts, record single interest transaction to operating
  if (report.ioltaRemittance && report.totalInterestEarned > 0) {
    const txn = await prisma.trustTransaction.create({
      data: {
        trustAccountId,
        clientLedgerId: report.allocations[0]?.clientLedgerId, // Use first ledger as placeholder
        transactionType: 'interest',
        amount: new Decimal(report.totalInterestEarned),
        description: `Interest earned ${report.periodStart.toISOString().split('T')[0]} to ${report.periodEnd.toISOString().split('T')[0]}`,
        transactionDate: report.periodEnd,
        payee: report.ioltaRemittance.recipientName,
        createdBy,
        runningBalance: new Decimal(0), // Will be updated
      },
    })
    transactionIds.push(txn.id)
  } else {
    // For non-IOLTA, distribute interest to each client ledger
    for (const alloc of report.allocations) {
      if (alloc.interestEarned <= 0) continue

      const txn = await prisma.trustTransaction.create({
        data: {
          trustAccountId,
          clientLedgerId: alloc.clientLedgerId,
          transactionType: 'interest',
          amount: new Decimal(alloc.interestEarned),
          description: `Interest earned ${report.periodStart.toISOString().split('T')[0]} to ${report.periodEnd.toISOString().split('T')[0]}`,
          transactionDate: report.periodEnd,
          createdBy,
          runningBalance: new Decimal(0), // Will be updated
        },
      })
      transactionIds.push(txn.id)

      // Update client ledger balance
      await prisma.clientTrustLedger.update({
        where: { id: alloc.clientLedgerId },
        data: {
          balance: { increment: alloc.interestEarned },
        },
      })
    }
  }

  return { transactionIds }
}
