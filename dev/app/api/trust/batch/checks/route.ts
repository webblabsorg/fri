import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  generateCheckPrintBatch,
  getNextCheckNumber,
  getCheckRegister,
} from '@/lib/finance/batch-transactions'

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
    const trustAccountId = searchParams.get('trustAccountId')
    const action = searchParams.get('action')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!trustAccountId) {
      return NextResponse.json({ error: 'Trust account ID is required' }, { status: 400 })
    }

    if (action === 'next-check-number') {
      const nextNumber = await getNextCheckNumber(
        organizationId,
        trustAccountId
      )

      return NextResponse.json({
        success: true,
        nextCheckNumber: nextNumber,
      })
    }

    // Get check register
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status') as 'printed' | 'cleared' | 'voided' | 'outstanding' | null

    const register = await getCheckRegister(
      organizationId,
      trustAccountId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || undefined,
      }
    )

    return NextResponse.json({
      success: true,
      checks: register,
      summary: {
        total: register.length,
        totalAmount: register.reduce((sum, c) => sum + c.amount, 0),
        printed: register.filter((c) => c.status === 'printed').length,
        cleared: register.filter((c) => c.status === 'cleared').length,
        outstanding: register.filter((c) => c.status === 'outstanding').length,
        voided: register.filter((c) => c.status === 'voided').length,
      },
    })
  } catch (error) {
    console.error('Error getting check data:', error)
    return NextResponse.json(
      { error: 'Failed to get check data' },
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
    const { organizationId, trustAccountId, transactionIds, startingCheckNumber } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active', role: { in: ['owner', 'admin'] } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!trustAccountId) {
      return NextResponse.json({ error: 'Trust account ID is required' }, { status: 400 })
    }

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: 'Transaction IDs are required' }, { status: 400 })
    }

    // Get next check number if not provided
    const checkNumber = startingCheckNumber || await getNextCheckNumber(
      organizationId,
      trustAccountId
    )

    const batch = await generateCheckPrintBatch(
      organizationId,
      trustAccountId,
      transactionIds,
      checkNumber,
      user.id
    )

    return NextResponse.json({
      success: true,
      batch,
    })
  } catch (error) {
    console.error('Error generating check batch:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate check batch' },
      { status: 500 }
    )
  }
}
