import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateTransactionRegister } from '@/lib/finance/trust-service'

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
    const clientLedgerId = searchParams.get('clientLedgerId') || undefined
    const transactionType = searchParams.get('transactionType') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeVoided = searchParams.get('includeVoided') === 'true'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const report = await generateTransactionRegister({
      organizationId,
      trustAccountId,
      clientLedgerId,
      transactionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeVoided,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating transaction register:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
