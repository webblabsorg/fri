import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const deviceSchema = z.object({
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android']),
  model: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  pushToken: z.string().optional(),
  pushEnabled: z.boolean().optional(),
})

// GET - List user's devices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const devices = await prisma.mobileDevice.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { lastActiveAt: 'desc' },
    })

    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

// POST - Register or update device
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = deviceSchema.parse(body)

    const device = await prisma.mobileDevice.upsert({
      where: { deviceId: validated.deviceId },
      update: {
        ...validated,
        userId: (session.user as any).id,
        lastActiveAt: new Date(),
      },
      create: {
        ...validated,
        userId: (session.user as any).id,
        lastActiveAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, device })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error registering device:', error)
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    )
  }
}

// PATCH - Update push token or settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deviceId, pushToken, pushEnabled } = body

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    const device = await prisma.mobileDevice.update({
      where: { deviceId },
      data: {
        ...(pushToken !== undefined && { pushToken }),
        ...(pushEnabled !== undefined && { pushEnabled }),
        lastActiveAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, device })
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    )
  }
}

// DELETE - Unregister device
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    await prisma.mobileDevice.delete({
      where: { deviceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unregistering device:', error)
    return NextResponse.json(
      { error: 'Failed to unregister device' },
      { status: 500 }
    )
  }
}
