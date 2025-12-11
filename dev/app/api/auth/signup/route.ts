import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateEmailVerificationToken } from '@/lib/auth'
import { signUpSchema } from '@/lib/validations/auth'
import { sendEmail, getVerificationEmailTemplate } from '@/lib/email'
import { isSignupAllowed } from '@/lib/launch-settings'

export async function POST(request: NextRequest) {
  try {
    // Check if public signups are allowed
    const signupsOpen = await isSignupAllowed()
    if (!signupsOpen) {
      return NextResponse.json(
        { 
          error: 'Signups are currently invite-only. Please join the waitlist.',
          code: 'SIGNUPS_CLOSED',
          waitlistUrl: '/waitlist',
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = signUpSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, email, password, firmName, role, marketingOptIn } =
      validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        firmName: firmName || null,
        role: role || 'user',
        marketingOptIn: marketingOptIn || false,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        status: 'pending_verification',
      },
    })

    // Create default organization for the user (1-user-per-org for Phase 0-6)
    const organization = await prisma.organization.create({
      data: {
        name: firmName || `${name}'s Organization`,
        type: 'solo',
        planTier: 'free',
        subscriptionStatus: 'active',
        seatsTotal: 1,
        seatsUsed: 1,
        billingEmail: email.toLowerCase(),
      },
    })

    // Link user to organization
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      },
    })

    // Create personal workspace
    const workspace = await prisma.workspace.create({
      data: {
        organizationId: organization.id,
        name: 'My Workspace',
        type: 'personal',
        ownerId: user.id,
        status: 'active',
      },
    })

    // Link user to workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'admin',
      },
    })

    // Generate email verification token
    const verificationToken = await generateEmailVerificationToken(user.id)

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email/${verificationToken}`
    await sendEmail({
      to: user.email,
      subject: 'Verify your email - Frith AI',
      html: getVerificationEmailTemplate(user.name, verificationUrl),
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: 'user_signup',
        eventData: {
          email: user.email,
          subscriptionTier: 'free',
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message:
          'Account created successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup. Please try again.' },
      { status: 500 }
    )
  }
}
