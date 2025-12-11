import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Verify and decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
    }

    // Get invitation details
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        token,
        status: 'pending',
        expiresAt: { gt: new Date() }
      },
      include: {
        organization: true,
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 })
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          type: invitation.organization.type
        },
        inviter: invitation.inviter,
        expiresAt: invitation.expiresAt
      }
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await params
    const userId = (session.user as any).id
    const userEmail = (session.user as any).email

    // Verify and decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
    }

    // Get invitation
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        token,
        status: 'pending',
        expiresAt: { gt: new Date() }
      },
      include: {
        organization: true
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 })
    }

    // Verify email matches
    if (invitation.email !== userEmail) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 })
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this organization' }, { status: 400 })
    }

    // Create organization membership
    const membership = await prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        status: 'active'
      }
    })

    // Add to default workspace if exists
    const defaultWorkspace = await prisma.workspace.findFirst({
      where: {
        organizationId: invitation.organizationId,
        isDefault: true
      }
    })

    if (defaultWorkspace) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: defaultWorkspace.id,
          userId,
          role: invitation.role === 'owner' ? 'owner' : 'member'
        }
      })
    }

    // Mark invitation as accepted
    await prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: userId
      }
    })

    // Check if this is a Beta Program invitation and apply beta incentives
    const isBetaInvitation = invitation.organization.type === 'beta' || 
                              invitation.organization.name === 'Beta Program'
    
    if (isBetaInvitation) {
      // Calculate 3-month trial end date
      const betaTrialEndsAt = new Date()
      betaTrialEndsAt.setMonth(betaTrialEndsAt.getMonth() + 3)

      // Update user with beta incentives
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBetaUser: true,
          earlyAdopter: true,
          betaTrialEndsAt,
          betaInvitedAt: invitation.createdAt,
          subscriptionTier: 'professional', // Free Professional plan for beta
        }
      })
    }

    return NextResponse.json({
      success: true,
      isBetaUser: isBetaInvitation,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        role: membership.role
      }
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
