import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get counts by status
    const statusCounts = await prisma.feedback.groupBy({
      by: ['status'],
      _count: true,
    })

    return NextResponse.json({
      feedback,
      counts: statusCounts.reduce((acc: any, item) => {
        acc[item.status] = item._count
        return acc
      }, {}),
    })
  } catch (error) {
    console.error('Error fetching admin feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feedbackId, status, adminNotes } = body

    if (!feedbackId) {
      return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 })
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    updateData.updatedAt = new Date()

    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    )
  }
}
