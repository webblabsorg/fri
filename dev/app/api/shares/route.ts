import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 })
    }

    // Get shares for the target
    const shares = await prisma.share.findMany({
      where: {
        targetType,
        targetId,
        ownerId: userId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ shares })
  } catch (error) {
    console.error('Error fetching shares:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
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
    const { targetType, targetId, shareType, shareWith, permissions, expiresAt } = body

    if (!targetType || !targetId || !shareType) {
      return NextResponse.json({ error: 'targetType, targetId, and shareType are required' }, { status: 400 })
    }

    // Create share
    const share = await prisma.share.create({
      data: {
        ownerId: userId,
        targetType,
        targetId,
        shareType,
        shareWith,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    // Create notifications for specific users
    if (shareType === 'specific_users' && shareWith && Array.isArray(shareWith)) {
      const shareNotifications = shareWith.map((sharedUserId: string) => ({
        userId: sharedUserId,
        type: 'share',
        title: 'Content shared with you',
        message: `${(session.user as any).name} shared ${targetType} with you`,
        data: {
          shareId: share.id,
          targetType,
          targetId,
          ownerName: (session.user as any).name
        },
        actionUrl: `/dashboard/${targetType}/${targetId}`
      }))

      await prisma.notification.createMany({
        data: shareNotifications
      })
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'shared',
        targetType,
        targetId,
        description: `Shared ${targetType} with ${shareType}`,
        metadata: {
          shareId: share.id,
          shareType,
          shareWith: shareType === 'specific_users' ? shareWith : null
        }
      }
    })

    return NextResponse.json({ share })
  } catch (error) {
    console.error('Error creating share:', error)
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')

    if (!shareId) {
      return NextResponse.json({ error: 'shareId is required' }, { status: 400 })
    }

    // Check if user owns the share
    const share = await prisma.share.findFirst({
      where: {
        id: shareId,
        ownerId: userId
      }
    })

    if (!share) {
      return NextResponse.json({ error: 'Share not found or access denied' }, { status: 404 })
    }

    // Delete share
    await prisma.share.delete({
      where: { id: shareId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting share:', error)
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    )
  }
}
