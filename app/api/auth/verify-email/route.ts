import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyEmailToken, createSession } from '@/lib/auth'
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Verify token
    const userId = await verifyEmailToken(token)

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        status: 'active',
      },
    })

    // Create session (auto-login)
    const sessionToken = await createSession(user.id)

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Frith AI!',
      html: getWelcomeEmailTemplate(user.name),
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: 'email_verified',
        eventData: {
          email: user.email,
        },
      },
    })

    const response = NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    )

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    )
  }
}

// Resend verification email
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // For security, always return success even if user doesn't exist
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a verification email has been sent.',
      })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new token
    const { generateEmailVerificationToken } = await import('@/lib/auth')
    const verificationToken = await generateEmailVerificationToken(user.id)

    // Send email
    const { getVerificationEmailTemplate } = await import('@/lib/email')
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email/${verificationToken}`
    await sendEmail({
      to: user.email,
      subject: 'Verify your email - Frith AI',
      html: getVerificationEmailTemplate(user.name, verificationUrl),
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resending verification email' },
      { status: 500 }
    )
  }
}
