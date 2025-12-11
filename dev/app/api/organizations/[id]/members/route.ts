import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

type OrganizationInvitationWithInviter = {
  id: string
  email: string
  role: string
  status: string
  createdAt: Date
  expiresAt: Date
  inviter: {
    name: string
    email: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const userId = (session.user as any).id

    // Check if user is a member
    const userMembership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: 'active'
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all members
    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: 'active'
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
        { joinedAt: 'asc' }
      ]
    })

    // Get pending invitations (only for owners/admins)
    let invitations: OrganizationInvitationWithInviter[] = []
    if (['owner', 'admin'].includes(userMembership.role)) {
      invitations = await prisma.organizationInvitation.findMany({
        where: {
          organizationId,
          status: 'pending',
          expiresAt: { gt: new Date() }
        },
        include: {
          inviter: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        user: member.user
      })),
      invitations: invitations.map((inv: OrganizationInvitationWithInviter) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        inviter: inv.inviter
      }))
    })
  } catch (error) {
    console.error('Error fetching organization members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
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

    const { id: organizationId } = await params
    const userId = (session.user as any).id
    const body = await request.json()
    const { memberId, role, action } = body

    // Check if user has permission (owner or admin)
    const userMembership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        role: { in: ['owner', 'admin'] },
        status: 'active'
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get target member
    const targetMember = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId
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
      await prisma.organizationMember.update({
        where: { id: memberId },
        data: { status: 'removed' }
      })

      // Remove from all workspaces in this organization
      const workspaces = await prisma.workspace.findMany({
        where: { organizationId },
        select: { id: true }
      })

      for (const workspace of workspaces) {
        await prisma.workspaceMember.deleteMany({
          where: {
            workspaceId: workspace.id,
            userId: targetMember.userId
          }
        })
      }

      return NextResponse.json({ success: true, action: 'removed' })
    } else if (action === 'updateRole' && role) {
      // Update role
      const updatedMember = await prisma.organizationMember.update({
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
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating organization member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}
