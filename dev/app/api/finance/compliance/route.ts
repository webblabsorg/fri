import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  getComplianceDashboard,
  checkJurisdictionCompliance,
  getJurisdictionRules,
} from '@/lib/finance/compliance-rules'

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
    const jurisdiction = searchParams.get('jurisdiction')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (jurisdiction) {
      const results = await checkJurisdictionCompliance(organizationId, jurisdiction)
      const rules = await getJurisdictionRules(organizationId, jurisdiction)
      return NextResponse.json({ jurisdiction, results, rules })
    }

    const dashboard = await getComplianceDashboard(organizationId)
    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error checking compliance:', error)
    return NextResponse.json({ error: 'Failed to check compliance' }, { status: 500 })
  }
}
