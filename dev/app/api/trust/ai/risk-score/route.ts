import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  calculateComplianceRiskScore,
  getOrganizationComplianceRiskScores,
} from '@/lib/finance/ai-trust-monitor'

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

    const trustAccountId = searchParams.get('trustAccountId')

    if (trustAccountId) {
      const score = await calculateComplianceRiskScore(
        organizationId,
        trustAccountId
      )

      return NextResponse.json({
        success: true,
        score,
      })
    }

    const scores = await getOrganizationComplianceRiskScores(organizationId)

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length)
      : 0

    return NextResponse.json({
      success: true,
      scores,
      summary: {
        totalAccounts: scores.length,
        averageScore: avgScore,
        lowRisk: scores.filter((s) => s.riskLevel === 'low').length,
        mediumRisk: scores.filter((s) => s.riskLevel === 'medium').length,
        highRisk: scores.filter((s) => s.riskLevel === 'high').length,
        criticalRisk: scores.filter((s) => s.riskLevel === 'critical').length,
      },
    })
  } catch (error) {
    console.error('Error calculating risk scores:', error)
    return NextResponse.json(
      { error: 'Failed to calculate risk scores' },
      { status: 500 }
    )
  }
}
