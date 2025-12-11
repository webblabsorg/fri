import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
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
    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user has permission to invite (owner or admin)
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        role: { in: ['owner', 'admin'] },
        status: 'active'
      },
      include: {
        organization: true
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: { email }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId,
        email,
        status: 'pending'
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 })
    }

    // Create invitation token (7 days expiry)
    const invitationToken = jwt.sign(
      {
        organizationId,
        email,
        role,
        invitedBy: userId
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Save invitation to database
    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId,
        email,
        role,
        invitedBy: userId,
        token: invitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${invitationToken}`
    
    try {
      await resend.emails.send({
        from: 'Frith AI <noreply@frith.ai>',
        to: email,
        subject: `Invitation to join ${membership.organization.name} on Frith AI`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">You're invited to join ${membership.organization.name}</h1>
            <p>Hi there!</p>
            <p>${(session.user as any).name || (session.user as any).email} has invited you to join <strong>${membership.organization.name}</strong> on Frith AI.</p>
            <p>Frith AI is the leading legal AI platform with 240+ specialized tools for legal professionals.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
            </div>
            <p>This invitation will expire in 7 days.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the invitation creation if email fails
    }

    return NextResponse.json({ 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt
      }
    })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
