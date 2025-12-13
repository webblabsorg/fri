import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  getAvailableJurisdictions,
  getJurisdictionByCode,
  getJurisdictionRequirements,
  checkInternationalCompliance,
  seedInternationalJurisdictionRules,
} from '@/lib/finance/international-trust-rules'

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
    const code = searchParams.get('code')
    const action = searchParams.get('action')

    if (action === 'compliance' && code) {
      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
      }

      const member = await prisma.organizationMember.findFirst({
        where: { organizationId, userId: user.id, status: 'active' },
      })
      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const result = await checkInternationalCompliance(
        organizationId,
        code
      )

      return NextResponse.json({
        success: true,
        compliance: result,
      })
    }

    if (code) {
      const jurisdiction = getJurisdictionByCode(code)

      if (!jurisdiction) {
        return NextResponse.json({ error: 'Jurisdiction not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        jurisdiction,
        requirements: getJurisdictionRequirements(code),
      })
    }

    const jurisdictions = getAvailableJurisdictions()

    // Group by country
    const byCountry: Record<string, typeof jurisdictions> = {}
    for (const j of jurisdictions) {
      if (!byCountry[j.country]) {
        byCountry[j.country] = []
      }
      byCountry[j.country].push(j)
    }

    return NextResponse.json({
      success: true,
      jurisdictions,
      byCountry,
      summary: {
        total: jurisdictions.length,
        countries: Object.keys(byCountry).length,
      },
    })
  } catch (error) {
    console.error('Error getting jurisdictions:', error)
    return NextResponse.json(
      { error: 'Failed to get jurisdictions' },
      { status: 500 }
    )
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

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'seed') {
      await seedInternationalJurisdictionRules()

      return NextResponse.json({
        success: true,
        message: 'International jurisdiction rules seeded successfully',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing jurisdiction action:', error)
    return NextResponse.json(
      { error: 'Failed to process jurisdiction action' },
      { status: 500 }
    )
  }
}
