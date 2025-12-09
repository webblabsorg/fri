import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateProfileSchema } from '@/lib/validations/auth'

export async function PATCH(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from session
    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateProfileSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, firmName, role } = validationResult.data

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        firmName: firmName || null,
        role: role || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        firmName: true,
        role: true,
        subscriptionTier: true,
      },
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: 'profile_updated',
        details: {
          changes: {
            name: name !== user.name ? { from: user.name, to: name } : undefined,
            firmName: firmName !== user.firmName ? { from: user.firmName, to: firmName } : undefined,
            role: role !== user.role ? { from: user.role, to: role } : undefined,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
