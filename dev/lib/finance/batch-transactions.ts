import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { createTrustTransaction, AuditContext } from './trust-service'

// ============================================================================
// BATCH TRANSACTION PROCESSING
// Process multiple trust transactions efficiently
// ============================================================================

export interface BatchTransactionInput {
  trustAccountId: string
  clientLedgerId: string
  transactionType: 'deposit' | 'transfer_to_operating' | 'disbursement' | 'refund'
  amount: number
  description: string
  paymentMethod?: string
  checkNumber?: string
  referenceNumber?: string
  payee?: string
  transactionDate: Date
}

export interface BatchTransactionResult {
  success: boolean
  transactionId?: string
  error?: string
  input: BatchTransactionInput
}

export interface BatchProcessingResult {
  totalProcessed: number
  successCount: number
  failureCount: number
  results: BatchTransactionResult[]
  processingTimeMs: number
}

export async function processBatchTransactions(
  organizationId: string,
  transactions: BatchTransactionInput[],
  createdBy: string,
  auditContext?: AuditContext
): Promise<BatchProcessingResult> {
  const startTime = Date.now()
  const results: BatchTransactionResult[] = []
  let successCount = 0
  let failureCount = 0

  // Validate all transactions belong to the organization
  const trustAccountIds = [...new Set(transactions.map((t) => t.trustAccountId))]
  const validAccounts = await prisma.trustAccount.findMany({
    where: {
      id: { in: trustAccountIds },
      organizationId,
      isActive: true,
    },
  })

  const validAccountIds = new Set(validAccounts.map((a) => a.id))

  // Process transactions sequentially to maintain balance integrity
  for (const txn of transactions) {
    try {
      if (!validAccountIds.has(txn.trustAccountId)) {
        throw new Error('Trust account not found or not active')
      }

      const result = await createTrustTransaction({
        ...txn,
        createdBy,
        auditContext,
      })

      results.push({
        success: true,
        transactionId: result.id,
        input: txn,
      })
      successCount++
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        input: txn,
      })
      failureCount++
    }
  }

  return {
    totalProcessed: transactions.length,
    successCount,
    failureCount,
    results,
    processingTimeMs: Date.now() - startTime,
  }
}

// ============================================================================
// BATCH DEPOSIT PROCESSING
// ============================================================================

export interface BatchDepositInput {
  clientLedgerId: string
  amount: number
  description: string
  paymentMethod?: string
  checkNumber?: string
  referenceNumber?: string
}

export async function processBatchDeposits(
  organizationId: string,
  trustAccountId: string,
  deposits: BatchDepositInput[],
  transactionDate: Date,
  createdBy: string,
  auditContext?: AuditContext
): Promise<BatchProcessingResult> {
  const transactions: BatchTransactionInput[] = deposits.map((d) => ({
    trustAccountId,
    clientLedgerId: d.clientLedgerId,
    transactionType: 'deposit' as const,
    amount: d.amount,
    description: d.description,
    paymentMethod: d.paymentMethod,
    checkNumber: d.checkNumber,
    referenceNumber: d.referenceNumber,
    transactionDate,
  }))

  return processBatchTransactions(organizationId, transactions, createdBy, auditContext)
}

// ============================================================================
// BATCH DISBURSEMENT PROCESSING
// ============================================================================

export interface BatchDisbursementInput {
  clientLedgerId: string
  amount: number
  description: string
  payee: string
  paymentMethod?: string
  checkNumber?: string
  referenceNumber?: string
}

export async function processBatchDisbursements(
  organizationId: string,
  trustAccountId: string,
  disbursements: BatchDisbursementInput[],
  transactionDate: Date,
  createdBy: string,
  auditContext?: AuditContext
): Promise<BatchProcessingResult> {
  const transactions: BatchTransactionInput[] = disbursements.map((d) => ({
    trustAccountId,
    clientLedgerId: d.clientLedgerId,
    transactionType: 'disbursement' as const,
    amount: d.amount,
    description: d.description,
    payee: d.payee,
    paymentMethod: d.paymentMethod,
    checkNumber: d.checkNumber,
    referenceNumber: d.referenceNumber,
    transactionDate,
  }))

  return processBatchTransactions(organizationId, transactions, createdBy, auditContext)
}

// ============================================================================
// BATCH FEE TRANSFER (Trust to Operating)
// ============================================================================

export interface BatchFeeTransferInput {
  clientLedgerId: string
  amount: number
  invoiceId?: string
  description?: string
}

export async function processBatchFeeTransfers(
  organizationId: string,
  trustAccountId: string,
  transfers: BatchFeeTransferInput[],
  transactionDate: Date,
  createdBy: string,
  auditContext?: AuditContext
): Promise<BatchProcessingResult> {
  const transactions: BatchTransactionInput[] = transfers.map((t) => ({
    trustAccountId,
    clientLedgerId: t.clientLedgerId,
    transactionType: 'transfer_to_operating' as const,
    amount: t.amount,
    description: t.description || `Transfer earned fees to operating account`,
    referenceNumber: t.invoiceId,
    transactionDate,
  }))

  return processBatchTransactions(organizationId, transactions, createdBy, auditContext)
}

// ============================================================================
// CHECK PRINTING INTEGRATION
// ============================================================================

export interface CheckPrintData {
  checkNumber: string
  date: Date
  payee: string
  amount: number
  amountInWords: string
  memo: string
  bankName: string
  accountName: string
  routingNumber: string
  accountNumber: string
  clientName: string
  matterName?: string
  transactionId: string
}

export interface CheckPrintBatch {
  batchId: string
  trustAccountId: string
  trustAccountName: string
  checks: CheckPrintData[]
  totalAmount: number
  createdAt: Date
  createdBy: string
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (num === 0) return 'Zero'

  const dollars = Math.floor(num)
  const cents = Math.round((num - dollars) * 100)

  let words = ''

  if (dollars >= 1000000) {
    words += numberToWords(Math.floor(dollars / 1000000)) + ' Million '
    num = dollars % 1000000
  }

  if (dollars >= 1000) {
    const thousands = Math.floor((dollars % 1000000) / 1000)
    if (thousands > 0) {
      words += numberToWords(thousands) + ' Thousand '
    }
  }

  const hundreds = Math.floor((dollars % 1000) / 100)
  if (hundreds > 0) {
    words += ones[hundreds] + ' Hundred '
  }

  const remainder = dollars % 100
  if (remainder >= 20) {
    words += tens[Math.floor(remainder / 10)]
    if (remainder % 10 > 0) {
      words += '-' + ones[remainder % 10]
    }
    words += ' '
  } else if (remainder > 0) {
    words += ones[remainder] + ' '
  }

  words += 'and ' + cents.toString().padStart(2, '0') + '/100 Dollars'

  return words.trim()
}

export async function generateCheckPrintBatch(
  organizationId: string,
  trustAccountId: string,
  transactionIds: string[],
  startingCheckNumber: number,
  createdBy: string
): Promise<CheckPrintBatch> {
  const trustAccount = await prisma.trustAccount.findFirst({
    where: { id: trustAccountId, organizationId },
  })

  if (!trustAccount) {
    throw new Error('Trust account not found')
  }

  const transactions = await prisma.trustTransaction.findMany({
    where: {
      id: { in: transactionIds },
      trustAccountId,
      transactionType: { in: ['disbursement', 'refund'] },
      voidedAt: null,
    },
    include: {
      clientLedger: {
        include: { client: true, matter: true },
      },
    },
  })

  if (transactions.length === 0) {
    throw new Error('No valid transactions found for check printing')
  }

  const checks: CheckPrintData[] = []
  let checkNumber = startingCheckNumber

  for (const txn of transactions) {
    const checkData: CheckPrintData = {
      checkNumber: checkNumber.toString().padStart(6, '0'),
      date: txn.transactionDate,
      payee: txn.payee || txn.clientLedger.client.displayName,
      amount: Number(txn.amount),
      amountInWords: numberToWords(Number(txn.amount)),
      memo: txn.description,
      bankName: trustAccount.bankName,
      accountName: trustAccount.accountName,
      routingNumber: trustAccount.routingNumber || '',
      accountNumber: trustAccount.accountNumber,
      clientName: txn.clientLedger.client.displayName,
      matterName: txn.clientLedger.matter?.name,
      transactionId: txn.id,
    }

    checks.push(checkData)

    // Update transaction with check number
    await prisma.trustTransaction.update({
      where: { id: txn.id },
      data: { checkNumber: checkData.checkNumber },
    })

    checkNumber++
  }

  const batchId = `CHK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Log the check print batch
  await prisma.trustAuditLog.create({
    data: {
      eventType: 'check_batch_generated',
      eventData: {
        batchId,
        trustAccountId,
        checkCount: checks.length,
        startingCheckNumber,
        endingCheckNumber: checkNumber - 1,
        totalAmount: checks.reduce((sum, c) => sum + c.amount, 0),
        transactionIds,
      },
      userId: createdBy,
    },
  })

  return {
    batchId,
    trustAccountId,
    trustAccountName: trustAccount.accountName,
    checks,
    totalAmount: checks.reduce((sum, c) => sum + c.amount, 0),
    createdAt: new Date(),
    createdBy,
  }
}

export async function getNextCheckNumber(
  organizationId: string,
  trustAccountId: string
): Promise<number> {
  const lastCheck = await prisma.trustTransaction.findFirst({
    where: {
      trustAccountId,
      trustAccount: { organizationId },
      checkNumber: { not: null },
    },
    orderBy: { checkNumber: 'desc' },
  })

  if (!lastCheck?.checkNumber) {
    return 1001 // Default starting check number
  }

  const lastNumber = parseInt(lastCheck.checkNumber, 10)
  return isNaN(lastNumber) ? 1001 : lastNumber + 1
}

// ============================================================================
// CHECK REGISTER REPORT
// ============================================================================

export interface CheckRegisterEntry {
  checkNumber: string
  date: Date
  payee: string
  amount: number
  clientName: string
  matterName?: string
  description: string
  status: 'printed' | 'cleared' | 'voided' | 'outstanding'
  clearedDate?: Date
}

export async function getCheckRegister(
  organizationId: string,
  trustAccountId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    status?: 'printed' | 'cleared' | 'voided' | 'outstanding'
  }
): Promise<CheckRegisterEntry[]> {
  const where: Record<string, unknown> = {
    trustAccountId,
    trustAccount: { organizationId },
    checkNumber: { not: null },
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

  const transactions = await prisma.trustTransaction.findMany({
    where,
    include: {
      clientLedger: {
        include: { client: true, matter: true },
      },
    },
    orderBy: { checkNumber: 'asc' },
  })

  const entries: CheckRegisterEntry[] = transactions.map((txn) => {
    let status: CheckRegisterEntry['status'] = 'printed'
    if (txn.voidedAt) {
      status = 'voided'
    } else if (txn.clearedDate) {
      status = 'cleared'
    } else if (!txn.isCleared) {
      status = 'outstanding'
    }

    return {
      checkNumber: txn.checkNumber!,
      date: txn.transactionDate,
      payee: txn.payee || txn.clientLedger.client.displayName,
      amount: Number(txn.amount),
      clientName: txn.clientLedger.client.displayName,
      matterName: txn.clientLedger.matter?.name,
      description: txn.description,
      status,
      clearedDate: txn.clearedDate || undefined,
    }
  })

  if (options?.status) {
    return entries.filter((e) => e.status === options.status)
  }

  return entries
}
