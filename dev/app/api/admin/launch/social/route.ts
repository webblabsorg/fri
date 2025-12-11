import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const socialPostSchema = z.object({
  platform: z.enum(['twitter', 'linkedin', 'facebook']),
  content: z.string().min(1).max(2000),
  mediaUrl: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
})

// GET - List social posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || undefined
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (platform) where.platform = platform
    if (status) where.status = status

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.socialPost.count({ where }),
    ])

    // Get stats by platform
    const platformStats = await prisma.socialPost.groupBy({
      by: ['platform'],
      _count: { id: true },
    })

    // Get stats by status
    const statusStats = await prisma.socialPost.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        byPlatform: platformStats.reduce((acc, s) => {
          acc[s.platform] = s._count.id
          return acc
        }, {} as Record<string, number>),
        byStatus: statusStats.reduce((acc, s) => {
          acc[s.status] = s._count.id
          return acc
        }, {} as Record<string, number>),
      },
    })
  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social posts' },
      { status: 500 }
    )
  }
}

// POST - Create social post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = socialPostSchema.parse(body)

    const post = await prisma.socialPost.create({
      data: {
        platform: validated.platform,
        content: validated.content,
        mediaUrl: validated.mediaUrl,
        status: validated.status || 'draft',
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
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
    console.error('Error creating social post:', error)
    return NextResponse.json(
      { error: 'Failed to create social post' },
      { status: 500 }
    )
  }
}

// PATCH - Update social post
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing post id' }, { status: 400 })
    }

    // Handle publish action (mark as published after posting to platform)
    if (action === 'mark_published') {
      const post = await prisma.socialPost.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          externalId: updates.externalId,
        },
      })
      return NextResponse.json({ success: true, post })
    }

    // Handle schedule action
    if (action === 'schedule' && updates.scheduledAt) {
      const post = await prisma.socialPost.update({
        where: { id },
        data: {
          status: 'scheduled',
          scheduledAt: new Date(updates.scheduledAt),
        },
      })
      return NextResponse.json({ success: true, post })
    }

    // Handle failure
    if (action === 'mark_failed') {
      const post = await prisma.socialPost.update({
        where: { id },
        data: {
          status: 'failed',
          errorMsg: updates.errorMsg,
        },
      })
      return NextResponse.json({ success: true, post })
    }

    // General update
    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        content: updates.content,
        mediaUrl: updates.mediaUrl,
      },
    })

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error('Error updating social post:', error)
    return NextResponse.json(
      { error: 'Failed to update social post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete social post
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

    await prisma.socialPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting social post:', error)
    return NextResponse.json(
      { error: 'Failed to delete social post' },
      { status: 500 }
    )
  }
}
