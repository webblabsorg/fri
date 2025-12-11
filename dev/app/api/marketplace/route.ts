import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const marketplaceToolSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  longDescription: z.string().optional(),
  category: z.string().min(1),
  icon: z.string().url().optional(),
  screenshots: z.array(z.string().url()).optional(),
  pricing: z.enum(['free', 'paid', 'freemium']),
  pricePerRun: z.number().optional(),
  monthlyPrice: z.number().optional(),
  apiEndpoint: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
})

// GET - Browse marketplace or get tool details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get single tool by slug
    if (slug) {
      const tool = await prisma.marketplaceTool.findUnique({
        where: { slug, status: 'published' },
      })

      if (!tool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
      }

      return NextResponse.json({ tool })
    }

    // Build where clause
    const where: any = { status: 'published' }
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tools, total] = await Promise.all([
      prisma.marketplaceTool.findMany({
        where,
        orderBy: [{ installCount: 'desc' }, { rating: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          category: true,
          icon: true,
          pricing: true,
          pricePerRun: true,
          monthlyPrice: true,
          installCount: true,
          rating: true,
          reviewCount: true,
        },
      }),
      prisma.marketplaceTool.count({ where }),
    ])

    // Get categories with counts
    const categories = await prisma.marketplaceTool.groupBy({
      by: ['category'],
      where: { status: 'published' },
      _count: { id: true },
    })

    return NextResponse.json({
      tools,
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count.id,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching marketplace:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplace' },
      { status: 500 }
    )
  }
}

// POST - Submit tool to marketplace (for developers)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, ...toolData } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check user has admin access to organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: (session.user as any).id,
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const validated = marketplaceToolSchema.parse(toolData)

    // Check slug uniqueness
    const existing = await prisma.marketplaceTool.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    const tool = await prisma.marketplaceTool.create({
      data: {
        developerId: organizationId,
        ...validated,
        status: 'draft',
      },
    })

    return NextResponse.json({
      success: true,
      tool,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating marketplace tool:', error)
    return NextResponse.json(
      { error: 'Failed to create marketplace tool' },
      { status: 500 }
    )
  }
}

// PATCH - Update tool or submit for review
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Tool ID required' }, { status: 400 })
    }

    const tool = await prisma.marketplaceTool.findUnique({
      where: { id },
    })

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    // Check ownership
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: tool.developerId,
        userId: (session.user as any).id,
        role: { in: ['owner', 'admin'] },
      },
    })

    const isAdmin = (session.user as any).role === 'admin'

    if (!membership && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Handle actions
    if (action === 'submit_for_review') {
      if (tool.status !== 'draft') {
        return NextResponse.json(
          { error: 'Only draft tools can be submitted' },
          { status: 400 }
        )
      }

      const updated = await prisma.marketplaceTool.update({
        where: { id },
        data: { status: 'pending_review' },
      })

      return NextResponse.json({ success: true, tool: updated })
    }

    if (action === 'approve' && isAdmin) {
      const updated = await prisma.marketplaceTool.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, tool: updated })
    }

    if (action === 'reject' && isAdmin) {
      const updated = await prisma.marketplaceTool.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewNotes: updates.reviewNotes,
        },
      })

      return NextResponse.json({ success: true, tool: updated })
    }

    // General update
    const validated = marketplaceToolSchema.partial().parse(updates)
    const updated = await prisma.marketplaceTool.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json({ success: true, tool: updated })
  } catch (error) {
    console.error('Error updating marketplace tool:', error)
    return NextResponse.json(
      { error: 'Failed to update marketplace tool' },
      { status: 500 }
    )
  }
}
