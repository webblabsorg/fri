import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Get user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate password reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Create password reset record
    await prisma.passwordReset.create({
      data: {
        userId: id,
        token,
        expiresAt,
      },
    })

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${token}`

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request (Admin Initiated)',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>An administrator has initiated a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this reset, please contact support immediately.</p>
      `,
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'reset_password', 'user', id, {
      targetEmail: user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
    })
  } catch (error) {
    console.error('Admin reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to send password reset' },
      { status: 500 }
    )
  }
}
