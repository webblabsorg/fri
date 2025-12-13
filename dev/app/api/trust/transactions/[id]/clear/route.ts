import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: transactionId } = await params

    // Get the transaction
    const transaction = await prisma.trustTransaction.findUnique({
      where: { id: transactionId },
      include: {
        trustAccount: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user has access to the organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: transaction.trustAccount.organizationId,
        userId: user.id,
        status: 'active',
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if already cleared
    if (transaction.isCleared) {
      return NextResponse.json({ error: 'Transaction already cleared' }, { status: 400 })
    }

    // Check if transaction is reconciled - cannot clear after reconciliation
    if (transaction.isReconciled) {
      return NextResponse.json(
        { error: 'Cannot modify cleared status of reconciled transaction' },
        { status: 400 }
      )
    }

    // Update transaction to cleared
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.trustTransaction.update({
        where: { id: transactionId },
        data: {
          isCleared: true,
          clearedDate: new Date(),
        },
      })

      // Create audit log entry
      await tx.trustAuditLog.create({
        data: {
          trustTransactionId: transactionId,
          eventType: 'cleared',
          eventData: {
            clearedBy: user.id,
            clearedAt: new Date().toISOString(),
          },
          userId: user.id,
        },
      })

      return updated
    })

    return NextResponse.json({
      transaction: updatedTransaction,
      message: 'Transaction marked as cleared',
    })
  } catch (error) {
    console.error('Error clearing transaction:', error)
    return NextResponse.json({ error: 'Failed to clear transaction' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: transactionId } = await params

    // Get the transaction
    const transaction = await prisma.trustTransaction.findUnique({
      where: { id: transactionId },
      include: {
        trustAccount: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user has access to the organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: transaction.trustAccount.organizationId,
        userId: user.id,
        status: 'active',
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if transaction is reconciled - cannot uncleared after reconciliation
    if (transaction.isReconciled) {
      return NextResponse.json(
        { error: 'Cannot modify cleared status of reconciled transaction' },
        { status: 400 }
      )
    }

    // Check if not cleared
    if (!transaction.isCleared) {
      return NextResponse.json({ error: 'Transaction is not cleared' }, { status: 400 })
    }

    // Update transaction to uncleared
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.trustTransaction.update({
        where: { id: transactionId },
        data: {
          isCleared: false,
          clearedDate: null,
        },
      })

      // Create audit log entry
      await tx.trustAuditLog.create({
        data: {
          trustTransactionId: transactionId,
          eventType: 'uncleared',
          eventData: {
            unclearedBy: user.id,
            unclearedAt: new Date().toISOString(),
          },
          userId: user.id,
        },
      })

      return updated
    })

    return NextResponse.json({
      transaction: updatedTransaction,
      message: 'Transaction cleared status removed',
    })
  } catch (error) {
    console.error('Error unclearing transaction:', error)
    return NextResponse.json({ error: 'Failed to unclear transaction' }, { status: 500 })
  }
}
