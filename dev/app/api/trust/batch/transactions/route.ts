import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAuditContext } from '@/lib/audit-context'
import {
  processBatchTransactions,
  processBatchDeposits,
  processBatchDisbursements,
  processBatchFeeTransfers,
  BatchTransactionInput,
} from '@/lib/finance/batch-transactions'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, trustAccountId, transactions, transactionDate, organizationId } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active', role: { in: ['owner', 'admin'] } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!trustAccountId) {
      return NextResponse.json({ error: 'Trust account ID is required' }, { status: 400 })
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Transactions array is required' }, { status: 400 })
    }

    const auditContext = getAuditContext(request)
    const txnDate = transactionDate ? new Date(transactionDate) : new Date()

    let result

    switch (type) {
      case 'deposits':
        result = await processBatchDeposits(
          organizationId,
          trustAccountId,
          transactions,
          txnDate,
          user.id,
          auditContext
        )
        break

      case 'disbursements':
        result = await processBatchDisbursements(
          organizationId,
          trustAccountId,
          transactions,
          txnDate,
          user.id,
          auditContext
        )
        break

      case 'fee_transfers':
        result = await processBatchFeeTransfers(
          organizationId,
          trustAccountId,
          transactions,
          txnDate,
          user.id,
          auditContext
        )
        break

      case 'mixed':
      default:
        const fullTransactions: BatchTransactionInput[] = transactions.map((t: BatchTransactionInput) => ({
          ...t,
          trustAccountId,
          transactionDate: txnDate,
        }))

        result = await processBatchTransactions(
          organizationId,
          fullTransactions,
          user.id,
          auditContext
        )
        break
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Error processing batch transactions:', error)
    return NextResponse.json(
      { error: 'Failed to process batch transactions' },
      { status: 500 }
    )
  }
}
