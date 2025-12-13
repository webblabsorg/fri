import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  getIrsMileageRate,
  getOrganizationMileageRate,
  setOrganizationMileageRate,
  getAllIrsRates,
  MileageType,
} from '@/lib/finance/mileage-service'

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
    const year = searchParams.get('year')
    const type = (searchParams.get('type') || 'business') as MileageType
    const allRates = searchParams.get('all') === 'true'

    if (allRates) {
      return NextResponse.json({
        rates: getAllIrsRates(),
        source: 'irs',
      })
    }

    if (organizationId) {
      const member = await prisma.organizationMember.findFirst({
        where: { organizationId, userId: user.id, status: 'active' },
      })

      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const rate = await getOrganizationMileageRate(
        organizationId,
        year ? parseInt(year) : undefined,
        type
      )
      return NextResponse.json(rate)
    }

    const rate = getIrsMileageRate(year ? parseInt(year) : undefined, type)
    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error fetching mileage rate:', error)
    return NextResponse.json({ error: 'Failed to fetch mileage rate' }, { status: 500 })
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
    const { organizationId, rate, type = 'business' } = body

    if (!organizationId || typeof rate !== 'number') {
      return NextResponse.json(
        { error: 'Organization ID and rate are required' },
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

    await setOrganizationMileageRate(organizationId, rate, type as MileageType)

    return NextResponse.json({
      message: 'Mileage rate updated',
      rate,
      type,
    })
  } catch (error) {
    console.error('Error setting mileage rate:', error)
    return NextResponse.json({ error: 'Failed to set mileage rate' }, { status: 500 })
  }
}
