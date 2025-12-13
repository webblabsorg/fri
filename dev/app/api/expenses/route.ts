import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createExpense, getExpenses, checkExpensePolicy } from '@/lib/finance/expense-service'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const userId = searchParams.get('userId') || undefined
    const matterId = searchParams.get('matterId') || undefined
    const clientId = searchParams.get('clientId') || undefined
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const isBillable = searchParams.get('isBillable')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await getExpenses(organizationId, {
      userId,
      matterId,
      clientId,
      category,
      status,
      isBillable: isBillable ? isBillable === 'true' : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

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
    const {
      organizationId,
      matterId,
      clientId,
      vendorId,
      category,
      subcategory,
      description,
      amount,
      currency,
      taxAmount,
      expenseDate,
      isBillable,
      markupPercent,
      receiptUrl,
      isMileage,
      mileageDistance,
      mileageRate,
      mileageStart,
      mileageEnd,
      paymentMethod,
    } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!category || !description || (!amount && !isMileage) || !expenseDate) {
      return NextResponse.json(
        { error: 'Category, description, amount (or mileage), and expense date are required' },
        { status: 400 }
      )
    }

    const policyCheck = await checkExpensePolicy(
      organizationId,
      category,
      amount,
      !!receiptUrl
    )

    const expense = await createExpense({
      organizationId,
      matterId,
      clientId,
      userId: user.id,
      vendorId,
      category,
      subcategory,
      description,
      amount,
      currency,
      taxAmount,
      expenseDate: new Date(expenseDate),
      isBillable,
      markupPercent,
      receiptUrl,
      isMileage,
      mileageDistance,
      mileageRate,
      mileageStart,
      mileageEnd,
      paymentMethod,
    })

    // Update expense based on policy check results
    const updateData: Record<string, unknown> = {}
    
    if (!policyCheck.valid) {
      updateData.policyViolation = true
      updateData.policyViolationReason = policyCheck.violations.join('; ')
    }

    // If policy requires approval, set status to pending_approval
    if (policyCheck.requiresApproval) {
      updateData.status = 'pending_approval'
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.expense.update({
        where: { id: expense.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      expense: { ...expense, ...updateData },
      policyWarnings: policyCheck.violations,
      requiresApproval: policyCheck.requiresApproval,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
