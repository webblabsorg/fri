import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')
    const tier = searchParams.get('tier')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'active',
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tier) {
      where.pricingTier = tier
    }

    // Get tools with pagination
    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
        orderBy: [{ popular: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.tool.count({ where }),
    ])

    return NextResponse.json({
      tools,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Tools fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }
}
