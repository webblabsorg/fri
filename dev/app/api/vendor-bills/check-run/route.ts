import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  createCheckRun,
  generateCheckPrintData,
  getCheckRunHistory,
  getNextCheckNumber,
} from '@/lib/finance/check-printing-service'

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
    const action = searchParams.get('action')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
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

    if (action === 'next-check-number') {
      const nextCheckNumber = await getNextCheckNumber(organizationId)
      return NextResponse.json({ nextCheckNumber })
    }

    // Default: return check run history
    const history = await getCheckRunHistory(organizationId)
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching check run data:', error)
    return NextResponse.json({ error: 'Failed to fetch check run data' }, { status: 500 })
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
    const {
      organizationId,
      billIds,
      checkDate,
      startingCheckNumber,
      consolidateByVendor = true,
    } = body

    if (!organizationId || !billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json(
        { error: 'Organization ID and bill IDs are required' },
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

    const checkRun = await createCheckRun({
      organizationId,
      billIds,
      checkDate: checkDate ? new Date(checkDate) : new Date(),
      startingCheckNumber,
      createdBy: user.id,
      consolidateByVendor,
    })

    // Generate print data for each check
    const printData = await Promise.all(
      checkRun.checks.map(async (check) => {
        const vendor = await prisma.vendor.findUnique({
          where: { id: check.vendorId },
          select: {
            address1: true,
            address2: true,
            city: true,
            state: true,
            postalCode: true,
          },
        })

        return generateCheckPrintData(check, checkRun.checkDate, vendor ? {
          address1: vendor.address1 ?? undefined,
          address2: vendor.address2 ?? undefined,
          city: vendor.city ?? undefined,
          state: vendor.state ?? undefined,
          postalCode: vendor.postalCode ?? undefined,
        } : undefined)
      })
    )

    return NextResponse.json({
      checkRun,
      printData,
      message: `Check run created with ${checkRun.checkCount} check(s)`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating check run:', error)
    const message = (error as Error).message || 'Failed to create check run'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
