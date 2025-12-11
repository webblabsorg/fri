import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    switch (filter) {
      case 'active':
        where.endedAt = null
        break
      case 'leads':
        where.leadCaptured = true
        break
      case 'converted':
        where.converted = true
        break
      case 'escalated':
        where.escalated = true
        break
    }

    const conversations = await prisma.chatbotConversation.findMany({
      where,
      orderBy: {
        startedAt: 'desc'
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      sessionId: conv.sessionId,
      userId: conv.userId,
      pageUrl: conv.pageUrl,
      startedAt: conv.startedAt.toISOString(),
      endedAt: conv.endedAt?.toISOString(),
      leadCaptured: conv.leadCaptured,
      converted: conv.converted,
      escalated: conv.escalated,
      messageCount: conv._count.messages,
      user: conv.user
    }))

    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
