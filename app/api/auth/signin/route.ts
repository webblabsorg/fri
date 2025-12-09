import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyPassword,
  createSession,
  handleFailedLogin,
  resetFailedLoginAttempts,
} from '@/lib/auth'
import { signInSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = signInSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validationResult.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      )
      return NextResponse.json(
        {
          error: `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minutes.`,
        },
        { status: 423 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)

    if (!isPasswordValid) {
      // Handle failed login
      const isLocked = await handleFailedLogin(user.id)

      if (isLocked) {
        return NextResponse.json(
          {
            error:
              'Too many failed login attempts. Your account has been locked for 30 minutes.',
          },
          { status: 423 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your email address before signing in.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      )
    }

    // Check account status
    if (user.status === 'suspended') {
      return NextResponse.json(
        {
          error: 'Your account has been suspended. Please contact support.',
        },
        { status: 403 }
      )
    }

    if (user.status === 'deleted') {
      return NextResponse.json(
        { error: 'This account no longer exists.' },
        { status: 403 }
      )
    }

    // Reset failed login attempts
    await resetFailedLoginAttempts(user.id)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session
    const sessionToken = await createSession(user.id)

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: 'user_signin',
        eventData: {
          email: user.email,
          rememberMe,
        },
      },
    })

    // Return user data and session
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          firmName: user.firmName,
        },
      },
      { status: 200 }
    )

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'An error occurred during sign in. Please try again.' },
      { status: 500 }
    )
  }
}
