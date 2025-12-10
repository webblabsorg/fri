import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    const user = sessionToken ? await getSessionUser(sessionToken) : null

    const body = await request.json()
    const { type, category, subject, message, rating, page } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: user?.id,
        type: type || 'general',
        category,
        subject,
        message,
        rating,
        page,
        userAgent: request.headers.get('user-agent'),
        status: 'new',
      },
    })

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        createdAt: feedback.createdAt,
      },
    })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    const user = sessionToken ? await getSessionUser(sessionToken) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where: any = {
      userId: user.id,
    }

    if (type) {
      where.type = type
    }

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
