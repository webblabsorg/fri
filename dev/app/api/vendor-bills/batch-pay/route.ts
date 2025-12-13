import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { batchPayVendorBills } from '@/lib/finance/expense-service'

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
    const { organizationId, payments } = body

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

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: 'At least one payment is required' },
        { status: 400 }
      )
    }

    const processedPayments = payments.map((p: {
      billId: string
      amount: number
      paymentMethod: string
      paymentDate: string
      checkNumber?: string
      referenceNumber?: string
      notes?: string
    }) => ({
      billId: p.billId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentDate: new Date(p.paymentDate),
      checkNumber: p.checkNumber,
      referenceNumber: p.referenceNumber,
      notes: p.notes,
    }))

    const result = await batchPayVendorBills(organizationId, processedPayments, user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error batch paying vendor bills:', error)
    return NextResponse.json({ error: 'Failed to batch pay vendor bills' }, { status: 500 })
  }
}
