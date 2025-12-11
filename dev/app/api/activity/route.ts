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
    const workspaceId = searchParams.get('workspaceId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (workspaceId) {
      // Check if user has access to this workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      where.workspaceId = workspaceId
    } else {
      // Get activity from all workspaces user has access to
      const userWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true }
      })

      const workspaceIds = userWorkspaces.map(w => w.workspaceId)
      where.OR = [
        { userId }, // User's own activity
        { workspaceId: { in: workspaceIds } } // Activity in user's workspaces
      ]
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
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
    const { action, targetType, targetId, description, metadata, workspaceId } = body

    if (!action || !targetType || !targetId || !description) {
      return NextResponse.json({ error: 'action, targetType, targetId, and description are required' }, { status: 400 })
    }

    // If workspaceId provided, check if user has access
    if (workspaceId) {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 })
      }
    }

    // Create activity log
    const activity = await prisma.activityLog.create({
      data: {
        userId,
        workspaceId,
        action,
        targetType,
        targetId,
        description,
        metadata
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
