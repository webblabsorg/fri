import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const topicSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(10),
})

const replySchema = z.object({
  topicId: z.string().uuid(),
  content: z.string().min(1),
})

// GET - List forum categories, topics, or single topic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // categories, topics, topic
    const categorySlug = searchParams.get('category')
    const topicId = searchParams.get('topicId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get categories
    if (type === 'categories' || !type) {
      const categories = await prisma.forumCategory.findMany({
        where: { isPrivate: false },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { topics: true } },
        },
      })

      return NextResponse.json({ categories })
    }

    // Get topics in category
    if (type === 'topics') {
      const where: any = {}
      
      if (categorySlug) {
        const category = await prisma.forumCategory.findUnique({
          where: { slug: categorySlug },
        })
        if (category) where.categoryId = category.id
      }

      const [topics, total] = await Promise.all([
        prisma.forumTopic.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { lastReplyAt: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
          include: {
            category: { select: { name: true, slug: true } },
            _count: { select: { replies: true } },
          },
        }),
        prisma.forumTopic.count({ where }),
      ])

      return NextResponse.json({
        topics,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    }

    // Get single topic with replies
    if (type === 'topic' && topicId) {
      const topic = await prisma.forumTopic.findUnique({
        where: { id: topicId },
        include: {
          category: { select: { name: true, slug: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit,
          },
        },
      })

      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }

      // Increment view count
      await prisma.forumTopic.update({
        where: { id: topicId },
        data: { viewCount: { increment: 1 } },
      })

      const totalReplies = await prisma.forumReply.count({
        where: { topicId },
      })

      return NextResponse.json({
        topic,
        pagination: { page, limit, total: totalReplies, pages: Math.ceil(totalReplies / limit) },
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching forum data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forum data' },
      { status: 500 }
    )
  }
}

// POST - Create topic or reply
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...data } = body

    if (type === 'topic') {
      const validated = topicSchema.parse(data)

      const topic = await prisma.forumTopic.create({
        data: {
          categoryId: validated.categoryId,
          authorId: (session.user as any).id,
          title: validated.title,
          content: validated.content,
        },
      })

      return NextResponse.json({ success: true, topic })
    }

    if (type === 'reply') {
      const validated = replySchema.parse(data)

      // Check topic exists and is not locked
      const topic = await prisma.forumTopic.findUnique({
        where: { id: validated.topicId },
      })

      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }

      if (topic.isLocked) {
        return NextResponse.json({ error: 'Topic is locked' }, { status: 403 })
      }

      const reply = await prisma.forumReply.create({
        data: {
          topicId: validated.topicId,
          authorId: (session.user as any).id,
          content: validated.content,
        },
      })

      // Update topic stats
      await prisma.forumTopic.update({
        where: { id: validated.topicId },
        data: {
          replyCount: { increment: 1 },
          lastReplyAt: new Date(),
          lastReplyById: (session.user as any).id,
        },
      })

      return NextResponse.json({ success: true, reply })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating forum content:', error)
    return NextResponse.json(
      { error: 'Failed to create forum content' },
      { status: 500 }
    )
  }
}

// PATCH - Update topic/reply or moderate
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id, action, ...updates } = body

    const isAdmin = (session.user as any).role === 'admin'

    if (type === 'topic') {
      const topic = await prisma.forumTopic.findUnique({ where: { id } })
      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }

      // Check ownership or admin
      if (topic.authorId !== (session.user as any).id && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Moderation actions (admin only)
      if (action === 'pin' && isAdmin) {
        await prisma.forumTopic.update({
          where: { id },
          data: { isPinned: true },
        })
        return NextResponse.json({ success: true })
      }

      if (action === 'unpin' && isAdmin) {
        await prisma.forumTopic.update({
          where: { id },
          data: { isPinned: false },
        })
        return NextResponse.json({ success: true })
      }

      if (action === 'lock' && isAdmin) {
        await prisma.forumTopic.update({
          where: { id },
          data: { isLocked: true },
        })
        return NextResponse.json({ success: true })
      }

      if (action === 'unlock' && isAdmin) {
        await prisma.forumTopic.update({
          where: { id },
          data: { isLocked: false },
        })
        return NextResponse.json({ success: true })
      }

      // Edit content
      if (updates.content || updates.title) {
        const updated = await prisma.forumTopic.update({
          where: { id },
          data: {
            ...(updates.title && { title: updates.title }),
            ...(updates.content && { content: updates.content }),
          },
        })
        return NextResponse.json({ success: true, topic: updated })
      }
    }

    if (type === 'reply') {
      const reply = await prisma.forumReply.findUnique({ where: { id } })
      if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
      }

      // Check ownership or admin
      if (reply.authorId !== (session.user as any).id && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Mark as accepted answer (topic author or admin)
      if (action === 'accept') {
        const topic = await prisma.forumTopic.findUnique({
          where: { id: reply.topicId },
        })

        if (topic?.authorId !== (session.user as any).id && !isAdmin) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.forumReply.update({
          where: { id },
          data: { isAccepted: true },
        })

        await prisma.forumTopic.update({
          where: { id: reply.topicId },
          data: { status: 'resolved' },
        })

        return NextResponse.json({ success: true })
      }

      // Edit content
      if (updates.content) {
        const updated = await prisma.forumReply.update({
          where: { id },
          data: { content: updates.content },
        })
        return NextResponse.json({ success: true, reply: updated })
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating forum content:', error)
    return NextResponse.json(
      { error: 'Failed to update forum content' },
      { status: 500 }
    )
  }
}

// DELETE - Delete topic or reply
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 })
    }

    const isAdmin = (session.user as any).role === 'admin'

    if (type === 'topic') {
      const topic = await prisma.forumTopic.findUnique({ where: { id } })
      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }

      if (topic.authorId !== (session.user as any).id && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.forumTopic.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'reply') {
      const reply = await prisma.forumReply.findUnique({ where: { id } })
      if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
      }

      if (reply.authorId !== (session.user as any).id && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.forumReply.delete({ where: { id } })

      // Update topic reply count
      await prisma.forumTopic.update({
        where: { id: reply.topicId },
        data: { replyCount: { decrement: 1 } },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting forum content:', error)
    return NextResponse.json(
      { error: 'Failed to delete forum content' },
      { status: 500 }
    )
  }
}
