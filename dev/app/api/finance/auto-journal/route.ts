import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  createJournalFromInvoice,
  createJournalFromPayment,
  createJournalFromExpense,
  createJournalFromTrustTransfer,
  createJournalFromVendorPayment,
  processPendingJournalEntries,
} from '@/lib/finance/auto-journal-service'

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
    const { organizationId, transactionType, transactionId, batchProcess } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Batch process all pending transactions
    if (batchProcess) {
      const result = await processPendingJournalEntries(organizationId, user.id)
      return NextResponse.json({
        message: `Processed ${result.processed} transactions`,
        processed: result.processed,
        errors: result.errors,
      })
    }

    // Process single transaction
    if (!transactionType || !transactionId) {
      return NextResponse.json(
        { error: 'Transaction type and ID required (or set batchProcess: true)' },
        { status: 400 }
      )
    }

    let result: { journalEntryId: string; journalNumber: string }

    switch (transactionType) {
      case 'invoice':
        result = await createJournalFromInvoice(organizationId, transactionId, user.id)
        break
      case 'payment':
        result = await createJournalFromPayment(organizationId, transactionId, user.id)
        break
      case 'expense':
        result = await createJournalFromExpense(organizationId, transactionId, user.id)
        break
      case 'trust_transfer':
        result = await createJournalFromTrustTransfer(organizationId, transactionId, user.id)
        break
      case 'vendor_payment':
        result = await createJournalFromVendorPayment(organizationId, transactionId, user.id)
        break
      default:
        return NextResponse.json(
          { error: `Invalid transaction type: ${transactionType}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: 'Journal entry created',
      ...result,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating automatic journal entry:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create journal entry' },
      { status: 500 }
    )
  }
}
