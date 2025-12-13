import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  calculateInterestDistribution,
  recordInterestDistribution,
} from '@/lib/finance/trust-service'

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
    const trustAccountId = searchParams.get('trustAccountId') || undefined
    const periodStartStr = searchParams.get('periodStart')
    const periodEndStr = searchParams.get('periodEnd')
    const interestRateStr = searchParams.get('interestRate')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    // Verify user has access to organization
    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!periodStartStr || !periodEndStr) {
      return NextResponse.json(
        { error: 'periodStart and periodEnd are required' },
        { status: 400 }
      )
    }

    const periodStart = new Date(periodStartStr)
    const periodEnd = new Date(periodEndStr)
    const interestRate = interestRateStr ? parseFloat(interestRateStr) : undefined

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const reports = await calculateInterestDistribution({
      organizationId,
      trustAccountId,
      periodStart,
      periodEnd,
      interestRate,
    })

    return NextResponse.json({
      reports,
      summary: {
        accountCount: reports.length,
        totalInterestEarned: reports.reduce((sum, r) => sum + r.totalInterestEarned, 0),
        totalAverageDailyBalance: reports.reduce((sum, r) => sum + r.totalAverageDailyBalance, 0),
        ioltaRemittanceTotal: reports
          .filter(r => r.ioltaRemittance)
          .reduce((sum, r) => sum + (r.ioltaRemittance?.amount || 0), 0),
      },
    })
  } catch (error) {
    console.error('Error calculating interest distribution:', error)
    return NextResponse.json(
      { error: 'Failed to calculate interest distribution' },
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

    const body = await request.json()
    const { organizationId, trustAccountId, periodStart, periodEnd, interestRate, recordTransactions } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    // Verify user has access to organization
    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'periodStart and periodEnd are required' },
        { status: 400 }
      )
    }

    // Calculate interest distribution
    const reports = await calculateInterestDistribution({
      organizationId,
      trustAccountId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      interestRate,
    })

    // Optionally record transactions
    const recordedTransactions: { trustAccountId: string; transactionIds: string[] }[] = []
    
    if (recordTransactions) {
      for (const report of reports) {
        if (report.totalInterestEarned > 0) {
          const result = await recordInterestDistribution(
            organizationId,
            report.trustAccountId,
            report,
            user.id
          )
          recordedTransactions.push({
            trustAccountId: report.trustAccountId,
            transactionIds: result.transactionIds,
          })
        }
      }
    }

    return NextResponse.json({
      reports,
      recordedTransactions,
      summary: {
        accountCount: reports.length,
        totalInterestEarned: reports.reduce((sum, r) => sum + r.totalInterestEarned, 0),
        transactionsRecorded: recordedTransactions.reduce((sum, r) => sum + r.transactionIds.length, 0),
      },
    })
  } catch (error) {
    console.error('Error processing interest distribution:', error)
    return NextResponse.json(
      { error: 'Failed to process interest distribution' },
      { status: 500 }
    )
  }
}
