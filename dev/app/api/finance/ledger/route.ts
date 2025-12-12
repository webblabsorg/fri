import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getGeneralLedger } from '@/lib/finance/finance-service'

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
    const accountId = searchParams.get('accountId') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const fiscalYear = searchParams.get('fiscalYear')
    const fiscalPeriod = searchParams.get('fiscalPeriod')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const entries = await getGeneralLedger(organizationId, {
      accountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      fiscalYear: fiscalYear ? parseInt(fiscalYear) : undefined,
      fiscalPeriod: fiscalPeriod ? parseInt(fiscalPeriod) : undefined,
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching general ledger:', error)
    return NextResponse.json({ error: 'Failed to fetch general ledger' }, { status: 500 })
  }
}
