import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkForDuplicateExpense } from '@/lib/finance/expense-service'

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
    const { organizationId, description, amount, expenseDate, vendorId, excludeExpenseId } = body

    if (!organizationId || !description || !amount || !expenseDate) {
      return NextResponse.json(
        { error: 'Organization ID, description, amount, and expense date are required' },
        { status: 400 }
      )
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await checkForDuplicateExpense(
      organizationId,
      description,
      amount,
      new Date(expenseDate),
      vendorId,
      excludeExpenseId
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking for duplicate expenses:', error)
    return NextResponse.json({ error: 'Failed to check for duplicates' }, { status: 500 })
  }
}
