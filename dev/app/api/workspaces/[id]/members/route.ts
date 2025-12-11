import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const userId = (session.user as any).id

    // Check if user is a member of this workspace
    const userMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all members
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // owners first, then admins, then members
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        permissions: member.permissions,
        createdAt: member.createdAt,
        user: member.user
      }))
    })
  } catch (error) {
    console.error('Error fetching workspace members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const userId = (session.user as any).id
    const body = await request.json()
    const { userEmail, role = 'member', permissions } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Check if user has permission to add members (owner or admin)
    const userMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: { in: ['owner', 'admin'] }
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Find the user to add
    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: targetUser.id
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add user to workspace
    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role,
        permissions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json({
      member: {
        id: newMember.id,
        role: newMember.role,
        permissions: newMember.permissions,
        createdAt: newMember.createdAt,
        user: newMember.user
      }
    })
  } catch (error) {
    console.error('Error adding workspace member:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const userId = (session.user as any).id
    const body = await request.json()
    const { memberId, role, permissions, action } = body

    // Check if user has permission (owner or admin)
    const userMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: { in: ['owner', 'admin'] }
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get target member
    const targetMember = await prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId
      }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent non-owners from modifying owners
    if (targetMember.role === 'owner' && userMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Cannot modify owner permissions' }, { status: 403 })
    }

    // Prevent users from modifying themselves (except owners can change their own role)
    if (targetMember.userId === userId && userMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 403 })
    }

    if (action === 'remove') {
      // Remove member
      await prisma.workspaceMember.delete({
        where: { id: memberId }
      })

      return NextResponse.json({ success: true, action: 'removed' })
    } else if (action === 'updateRole' && role) {
      // Update role
      const updatedMember = await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'roleUpdated',
        member: {
          id: updatedMember.id,
          role: updatedMember.role
        }
      })
    } else if (action === 'updatePermissions' && permissions) {
      // Update permissions
      const updatedMember = await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { permissions }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'permissionsUpdated',
        member: {
          id: updatedMember.id,
          permissions: updatedMember.permissions
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating workspace member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}
