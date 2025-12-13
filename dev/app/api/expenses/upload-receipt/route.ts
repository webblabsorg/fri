import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadReceipt, processReceiptOcr } from '@/lib/finance/expense-service'

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
    const { organizationId, expenseId, receiptUrl } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!expenseId || !receiptUrl) {
      return NextResponse.json(
        { error: 'Expense ID and receipt URL are required' },
        { status: 400 }
      )
    }

    const ocrResult = await processReceiptOcr(receiptUrl)

    const expense = await uploadReceipt(expenseId, organizationId, receiptUrl, ocrResult)

    return NextResponse.json({
      expense,
      ocrResult,
      message: ocrResult.confidence > 0
        ? 'Receipt processed successfully'
        : 'Receipt uploaded. OCR processing requires integration with an OCR provider.',
    })
  } catch (error) {
    console.error('Error uploading receipt:', error)
    if ((error as Error).message) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 })
  }
}
