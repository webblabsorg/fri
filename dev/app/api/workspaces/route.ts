import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    // Get workspaces where user is a member
    const workspaceMemberships = await prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: organizationId ? {
          organizationId
        } : undefined
      },
      include: {
        workspace: {
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                members: true,
                projects: true
              }
            }
          }
        }
      },
      orderBy: {
        workspace: {
          createdAt: 'desc'
        }
      }
    })

    const workspaces = workspaceMemberships.map(membership => ({
      ...membership.workspace,
      role: membership.role,
      permissions: membership.permissions,
      memberCount: membership.workspace._count.members,
      projectCount: membership.workspace._count.projects
    }))

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { name, description, organizationId, type = 'team' } = body

    if (!name) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
    }

    // If organizationId provided, check if user has permission
    if (organizationId) {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          role: { in: ['owner', 'admin'] },
          status: 'active'
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        type,
        organizationId,
        ownerId: userId,
        isDefault: false
      }
    })

    // Add creator as owner
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: 'owner'
      }
    })

    return NextResponse.json({
      workspace: {
        ...workspace,
        role: 'owner',
        memberCount: 1,
        projectCount: 0
      }
    })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}
