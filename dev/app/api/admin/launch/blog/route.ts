import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const blogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

// GET - List blog posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ])

    // Get stats
    const stats = await prisma.blogPost.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        draft: statsMap.draft || 0,
        scheduled: statsMap.scheduled || 0,
        published: statsMap.published || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

// POST - Create blog post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = blogPostSchema.parse(body)

    // Check for duplicate slug
    const existing = await prisma.blogPost.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    const post = await prisma.blogPost.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt,
        content: validated.content,
        coverImage: validated.coverImage,
        authorId: (session.user as any).id,
        status: validated.status || 'draft',
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
        tags: validated.tags,
        seoTitle: validated.seoTitle,
        seoDescription: validated.seoDescription,
        publishedAt: validated.status === 'published' ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}

// PATCH - Update blog post
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing post id' }, { status: 400 })
    }

    // Handle publish action
    if (updates.action === 'publish') {
      const post = await prisma.blogPost.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, post })
    }

    // Handle schedule action
    if (updates.action === 'schedule' && updates.scheduledAt) {
      const post = await prisma.blogPost.update({
        where: { id },
        data: {
          status: 'scheduled',
          scheduledAt: new Date(updates.scheduledAt),
        },
      })
      return NextResponse.json({ success: true, post })
    }

    // General update
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: updates.title,
        excerpt: updates.excerpt,
        content: updates.content,
        coverImage: updates.coverImage,
        tags: updates.tags,
        seoTitle: updates.seoTitle,
        seoDescription: updates.seoDescription,
      },
    })

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing post id' }, { status: 400 })
    }

    await prisma.blogPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
