import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveBillingRate, resolveTimeEntryRate } from '@/lib/finance/billing-rate-service'

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
    const { organizationId, userId, matterId, clientId, matterType, date } = body

    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'organizationId and userId are required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If matterId provided, use the simpler helper that fetches matter details
    if (matterId && !clientId && !matterType) {
      const rate = await resolveTimeEntryRate(
        organizationId,
        userId,
        matterId,
        date ? new Date(date) : undefined
      )

      if (!rate) {
        return NextResponse.json({ error: 'No billing rate found' }, { status: 404 })
      }

      return NextResponse.json({ rate })
    }

    // Otherwise use full resolution with provided context
    const rate = await resolveBillingRate({
      organizationId,
      userId,
      matterId,
      clientId,
      matterType,
      date: date ? new Date(date) : undefined,
    })

    if (!rate) {
      return NextResponse.json({ error: 'No billing rate found' }, { status: 404 })
    }

    return NextResponse.json({ rate })
  } catch (error) {
    console.error('Error resolving billing rate:', error)
    return NextResponse.json({ error: 'Failed to resolve billing rate' }, { status: 500 })
  }
}
