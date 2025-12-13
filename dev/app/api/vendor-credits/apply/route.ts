import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { applyVendorCredit } from '@/lib/finance/vendor-credit-service'

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
    const { organizationId, creditId, billId, amount, notes } = body

    if (!organizationId || !creditId || !billId || !amount) {
      return NextResponse.json(
        { error: 'Organization ID, credit ID, bill ID, and amount are required' },
        { status: 400 }
      )
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

    const application = await applyVendorCredit(organizationId, {
      creditId,
      billId,
      amount,
      appliedBy: user.id,
      notes,
    })

    return NextResponse.json({
      application,
      message: 'Credit applied successfully',
    })
  } catch (error) {
    console.error('Error applying vendor credit:', error)
    const message = (error as Error).message || 'Failed to apply vendor credit'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
