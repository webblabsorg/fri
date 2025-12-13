import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { suggestExpenseSplit } from '@/lib/finance/ai-financial-service'

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
    const { organizationId, expenseId, description, amount } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!expenseId || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'Expense ID, description, and amount are required' },
        { status: 400 }
      )
    }

    const suggestion = await suggestExpenseSplit(
      organizationId,
      expenseId,
      description,
      amount
    )

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Error suggesting expense split:', error)
    return NextResponse.json({ error: 'Failed to suggest expense split' }, { status: 500 })
  }
}
