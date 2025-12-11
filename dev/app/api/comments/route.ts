import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 })
    }

    // Get comments for the target
    const comments = await prisma.comment.findMany({
      where: {
        targetType,
        targetId,
        parentId: null // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { content, targetType, targetId, parentId, mentions } = body

    if (!content || !targetType || !targetId) {
      return NextResponse.json({ error: 'content, targetType, and targetId are required' }, { status: 400 })
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        targetType,
        targetId,
        parentId,
        mentions,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    // Create notifications for mentions
    if (mentions && Array.isArray(mentions)) {
      const mentionNotifications = mentions.map((mentionedUserId: string) => ({
        userId: mentionedUserId,
        type: 'mention',
        title: 'You were mentioned in a comment',
        message: `${(session.user as any).name} mentioned you in a comment`,
        data: {
          commentId: comment.id,
          targetType,
          targetId,
          authorName: (session.user as any).name
        },
        actionUrl: `/dashboard/${targetType}/${targetId}#comment-${comment.id}`
      }))

      await prisma.notification.createMany({
        data: mentionNotifications
      })
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'commented',
        targetType,
        targetId,
        description: `Added a comment`,
        metadata: {
          commentId: comment.id,
          content: content.substring(0, 100) // First 100 chars
        }
      }
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
