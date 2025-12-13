import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPredictiveTrustBalances } from '@/lib/finance/ai-trust-monitor'

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
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const forecastDays = parseInt(searchParams.get('forecastDays') || '90', 10)

    const predictions = await getPredictiveTrustBalances(
      organizationId,
      forecastDays
    )

    const urgentCount = predictions.filter(
      (p) => p.daysUntilDepletion !== null && p.daysUntilDepletion <= 14
    ).length

    const warningCount = predictions.filter(
      (p) => p.daysUntilDepletion !== null && p.daysUntilDepletion > 14 && p.daysUntilDepletion <= 30
    ).length

    return NextResponse.json({
      success: true,
      predictions,
      summary: {
        totalLedgers: predictions.length,
        urgentDepletion: urgentCount,
        warningDepletion: warningCount,
        healthyLedgers: predictions.length - urgentCount - warningCount,
        totalCurrentBalance: predictions.reduce((sum, p) => sum + p.currentBalance, 0),
      },
    })
  } catch (error) {
    console.error('Error getting predictive balances:', error)
    return NextResponse.json(
      { error: 'Failed to get predictive balances' },
      { status: 500 }
    )
  }
}
