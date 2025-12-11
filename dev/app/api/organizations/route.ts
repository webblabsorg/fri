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

    // Get organizations where user is a member
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                workspaces: true
              }
            }
          }
        }
      }
    })

    const organizations = memberships.map(membership => ({
      ...membership.organization,
      role: membership.role,
      joinedAt: membership.joinedAt,
      memberCount: membership.organization._count.members,
      workspaceCount: membership.organization._count.workspaces
    }))

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
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
    const { name, type, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        type: type || 'law_firm',
        description,
        status: 'active'
      }
    })

    // Add creator as owner
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId,
        role: 'owner',
        status: 'active'
      }
    })

    // Create default workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'General',
        description: 'Default workspace',
        organizationId: organization.id,
        ownerId: userId,
        isDefault: true
      }
    })

    // Add user to default workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: 'owner'
      }
    })

    return NextResponse.json({ 
      organization: {
        ...organization,
        role: 'owner',
        memberCount: 1,
        workspaceCount: 1
      }
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
