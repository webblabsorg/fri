import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRecommendedVendors } from '@/lib/finance/vendor-performance-service'

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
    const vendorType = searchParams.get('vendorType') || undefined
    const category = searchParams.get('category') || undefined
    const maxResults = parseInt(searchParams.get('maxResults') || '5')
    const minPerformanceScore = parseInt(searchParams.get('minScore') || '50')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const recommendations = await getRecommendedVendors(organizationId, {
      vendorType,
      category,
      maxResults,
      minPerformanceScore,
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Error fetching vendor recommendations:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
