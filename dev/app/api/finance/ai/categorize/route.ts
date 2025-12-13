import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { categorizeExpense, learnFromCorrection } from '@/lib/finance/ai-financial-service'

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
    const { organizationId, description, vendorName, amount, expenseId, correctedCategory, correctedSubcategory } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If this is a correction, learn from it
    if (expenseId && correctedCategory) {
      await learnFromCorrection(organizationId, expenseId, correctedCategory, correctedSubcategory)
      return NextResponse.json({ 
        message: 'Category correction recorded',
        category: correctedCategory,
        subcategory: correctedSubcategory,
      })
    }

    // Otherwise, predict category
    if (!description) {
      return NextResponse.json({ error: 'Description required for categorization' }, { status: 400 })
    }

    const prediction = await categorizeExpense(organizationId, description, vendorName, amount)

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error categorizing expense:', error)
    return NextResponse.json({ error: 'Failed to categorize expense' }, { status: 500 })
  }
}
