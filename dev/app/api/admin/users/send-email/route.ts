import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

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
    const { userIds, subject, message, sendToAll = false } = body

    // Validate input
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    let targetUsers

    if (sendToAll) {
      // Send to all active users
      targetUsers = await prisma.user.findMany({
        where: {
          status: 'active',
          emailVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users
      targetUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'No users specified' },
        { status: 400 }
      )
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: 'No eligible users found' },
        { status: 400 }
      )
    }

    // Send emails (in batches for performance)
    const batchSize = 50
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = targetUsers.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            await sendEmail({
              to: user.email,
              subject,
              html: `
                <h2>${subject}</h2>
                <p>Hello ${user.name},</p>
                ${message}
                <hr />
                <p style="color: #666; font-size: 12px;">
                  This email was sent by a Frith AI administrator.
                </p>
              `,
            })
            successCount++
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error)
            failCount++
          }
        })
      )
    }

    // Log admin action
    await logAdminAction(adminUser.id, 'send_email', 'user', null, {
      subject,
      recipientCount: targetUsers.length,
      successCount,
      failCount,
      sendToAll,
    })

    return NextResponse.json({
      success: true,
      totalSent: successCount,
      totalFailed: failCount,
      totalRecipients: targetUsers.length,
    })
  } catch (error) {
    console.error('Admin send email error:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
