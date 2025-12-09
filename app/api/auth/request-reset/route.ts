import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePasswordResetToken } from '@/lib/auth'
import { requestPasswordResetSchema } from '@/lib/validations/auth'
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = requestPasswordResetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email } = validationResult.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // For security, always return success even if user doesn't exist
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = await generatePasswordResetToken(user.id)

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/${resetToken}`
    await sendEmail({
      to: user.email,
      subject: 'Reset your password - Frith AI',
      html: getPasswordResetEmailTemplate(user.name, resetUrl),
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: 'password_reset_requested',
        eventData: {
          email: user.email,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Request reset error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
