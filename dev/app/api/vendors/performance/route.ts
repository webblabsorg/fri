import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  calculateVendorPerformance,
  getVendorPerformanceReport,
  batchUpdateVendorRatings,
} from '@/lib/finance/vendor-performance-service'

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
    const vendorId = searchParams.get('vendorId')
    const vendorType = searchParams.get('vendorType') || undefined
    const minInvoices = parseInt(searchParams.get('minInvoices') || '0')
    const sortBy = (searchParams.get('sortBy') || 'performanceScore') as 'performanceScore' | 'totalSpend' | 'rating'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Single vendor performance
    if (vendorId) {
      const metrics = await calculateVendorPerformance(organizationId, vendorId)
      return NextResponse.json({ metrics })
    }

    // All vendors performance report
    const report = await getVendorPerformanceReport(organizationId, {
      vendorType,
      minInvoices,
      sortBy,
      sortOrder,
    })

    return NextResponse.json({ vendors: report })
  } catch (error) {
    console.error('Error fetching vendor performance:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor performance' }, { status: 500 })
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
    const { organizationId, action } = body

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

    if (action === 'batch-update-ratings') {
      const result = await batchUpdateVendorRatings(organizationId)
      return NextResponse.json({
        message: `Updated ${result.updated} vendor ratings`,
        ...result,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating vendor performance:', error)
    return NextResponse.json({ error: 'Failed to update vendor performance' }, { status: 500 })
  }
}
