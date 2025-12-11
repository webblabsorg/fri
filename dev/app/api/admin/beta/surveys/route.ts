import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/db'
import { sendBetaSurveyEmail } from '@/lib/email'

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

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const candidates = await prisma.user.findMany({
      where: {
        status: 'active',
        onboardingCompleted: true,
        createdAt: { lte: sevenDaysAgo },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    let surveysSent = 0

    for (const user of candidates) {
      const existing = await prisma.feedback.findFirst({
        where: {
          userId: user.id,
          type: 'survey',
        },
      })

      if (existing) {
        continue
      }

      const ok = await sendBetaSurveyEmail(user.email, user.name || user.email, user.id)
      if (ok) {
        surveysSent += 1
      }
    }

    return NextResponse.json({
      success: true,
      totalCandidates: candidates.length,
      surveysSent,
    })
  } catch (error) {
    console.error('Beta survey send error:', error)
    return NextResponse.json({ error: 'Failed to send beta surveys' }, { status: 500 })
  }
}
