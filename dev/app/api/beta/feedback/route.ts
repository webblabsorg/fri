import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum([
    'general',
    'feature_request',
    'bug_report',
    'tool_feedback',
    'usability',
    'survey',
  ]),
  category: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  // Allow 0–10 so we can store NPS-style scores from beta surveys while
  // still supporting 1–5 star ratings from the in-app widget.
  rating: z.number().min(0).max(10).optional(),
  toolId: z.string().optional(),
  page: z.string().optional(),
})

// GET - Get user's feedback history
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const feedback = await prisma.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Feedback fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

// POST - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    let userId: string | null = null

    // Feedback can be submitted anonymously
    if (sessionToken) {
      const user = await getSessionUser(sessionToken)
      userId = user?.id || null
    }

    const body = await request.json()
    const validationResult = feedbackSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { type, category, subject, message, rating, toolId, page } = validationResult.data

    // Get user agent for context
    const userAgent = request.headers.get('user-agent') || undefined

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type,
        category: category || type,
        subject,
        message,
        rating,
        page: page || toolId,
        userAgent,
        status: 'new',
      },
    })

    // If this is tool feedback, we might want to link it
    if (toolId) {
      // Could create a ToolFeedback relation if needed
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        type: feedback.type,
        subject: feedback.subject,
        status: feedback.status,
        createdAt: feedback.createdAt.toISOString(),
      },
      message: 'Thank you for your feedback! We review all submissions.',
    })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
