import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'
import { sendBetaInvitationEmail } from '@/lib/email'
import { z } from 'zod'

const inviteBetaUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  firmName: z.string().optional(),
  notes: z.string().optional(),
})

// GET - List beta users
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause for beta users (users created during beta period)
    const whereClause: Record<string, unknown> = {}
    
    if (status === 'active') {
      whereClause.status = 'active'
    } else if (status === 'pending') {
      whereClause.status = 'pending_verification'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          firmName: true,
          status: true,
          subscriptionTier: true,
          createdAt: true,
          lastLoginAt: true,
          onboardingCompleted: true,
          _count: {
            select: {
              toolRuns: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ])

    // Get beta statistics
    const stats = await getBetaStats()

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats,
    })
  } catch (error) {
    console.error('Beta users list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beta users' },
      { status: 500 }
    )
  }
}

// POST - Invite beta user
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = inviteBetaUserSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, name, firmName, notes } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create invitation token
    const token = generateInviteToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store invitation (we'll use OrganizationInvitation model for this)
    // For beta, we create a special "beta" organization
    let betaOrg = await prisma.organization.findFirst({
      where: { name: 'Beta Program' },
    })

    if (!betaOrg) {
      betaOrg = await prisma.organization.create({
        data: {
          name: 'Beta Program',
          type: 'beta',
          planTier: 'professional',
          status: 'active',
        },
      })
    }

    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: betaOrg.id,
        email: email.toLowerCase(),
        role: 'member',
        token,
        status: 'pending',
        invitedBy: adminUser.id,
        expiresAt,
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'invite_beta_user', 'user', invitation.id, {
      email,
      name,
      firmName,
      notes,
    })

    // Send invitation email
    const emailSent = await sendBetaInvitationEmail(email, name, token)

    return NextResponse.json({
      success: true,
      emailSent,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt.toISOString(),
        inviteUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${token}`,
      },
    })
  } catch (error) {
    console.error('Beta user invite error:', error)
    return NextResponse.json(
      { error: 'Failed to invite beta user' },
      { status: 500 }
    )
  }
}

async function getBetaStats() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    totalToolRuns,
    toolRunsThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.toolRun.count({ where: { status: 'completed' } }),
    prisma.toolRun.count({
      where: {
        status: 'completed',
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ])

  return {
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    totalToolRuns,
    toolRunsThisWeek,
    targetUsers: 100, // Beta target
    progress: Math.min((totalUsers / 100) * 100, 100),
  }
}

function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
