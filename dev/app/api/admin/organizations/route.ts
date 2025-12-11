import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// GET - List all organizations (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const planTier = searchParams.get('planTier')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    
    if (planTier) {
      where.planTier = planTier
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          planTier: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              workspaces: true,
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ])

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

// POST - Create organization (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, planTier, ownerId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        planTier: planTier || 'free',
      },
    })

    // Add owner if specified
    if (ownerId) {
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: ownerId,
          role: 'owner',
        },
      })
    }

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}

// PATCH - Update organization (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, planTier, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(planTier && { planTier }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}
