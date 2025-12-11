import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const notificationSchema = z.object({
  userId: z.string().uuid(),
  deviceId: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.any()).optional(),
})

// GET - List push notifications for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId: (session.user as any).id }
    if (status) where.status = status

    const notifications = await prisma.pushNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - Send push notification (admin or system)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { broadcast, userIds, ...notificationData } = body

    // Broadcast to all users with push enabled
    if (broadcast) {
      const devices = await prisma.mobileDevice.findMany({
        where: { pushEnabled: true, pushToken: { not: null } },
        select: { userId: true, deviceId: true },
      })

      const notifications = await prisma.pushNotification.createMany({
        data: devices.map((d) => ({
          userId: d.userId,
          deviceId: d.deviceId,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
        })),
      })

      // In production, this would trigger actual push notification sending
      // via FCM (Firebase Cloud Messaging) or APNs

      return NextResponse.json({
        success: true,
        sent: notifications.count,
      })
    }

    // Send to specific users
    if (userIds && Array.isArray(userIds)) {
      const devices = await prisma.mobileDevice.findMany({
        where: {
          userId: { in: userIds },
          pushEnabled: true,
          pushToken: { not: null },
        },
        select: { userId: true, deviceId: true },
      })

      const notifications = await prisma.pushNotification.createMany({
        data: devices.map((d) => ({
          userId: d.userId,
          deviceId: d.deviceId,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
        })),
      })

      return NextResponse.json({
        success: true,
        sent: notifications.count,
      })
    }

    // Send to single user
    const validated = notificationSchema.parse(notificationData)

    const notification = await prisma.pushNotification.create({
      data: validated,
    })

    // In production, send via FCM/APNs here
    await prisma.pushNotification.update({
      where: { id: notification.id },
      data: { status: 'sent', sentAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      notification,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// PATCH - Update notification status (mark as delivered)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, status } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const notification = await prisma.pushNotification.update({
      where: { id: notificationId },
      data: {
        status,
        ...(status === 'delivered' && { deliveredAt: new Date() }),
      },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
