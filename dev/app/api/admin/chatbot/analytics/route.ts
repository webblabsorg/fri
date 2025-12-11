import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    // Get total conversations
    const totalConversations = await prisma.chatbotConversation.count()

    // Get active conversations (no endedAt)
    const activeConversations = await prisma.chatbotConversation.count({
      where: {
        endedAt: null
      }
    })

    // Get leads captured
    const leadsCaptured = await prisma.chatbotConversation.count({
      where: {
        leadCaptured: true
      }
    })

    // Get conversions today
    const conversionsToday = await prisma.chatbotConversation.count({
      where: {
        converted: true,
        startedAt: {
          gte: today
        }
      }
    })

    // Calculate average response time (mock for now)
    const avgResponseTime = 2.3

    // Calculate containment rate (conversations not escalated)
    const totalWithOutcome = await prisma.chatbotConversation.count({
      where: {
        endedAt: {
          not: null
        }
      }
    })

    const escalatedCount = await prisma.chatbotConversation.count({
      where: {
        escalated: true
      }
    })

    const containmentRate = totalWithOutcome > 0 
      ? Math.round(((totalWithOutcome - escalatedCount) / totalWithOutcome) * 100)
      : 0

    const stats = {
      totalConversations,
      activeConversations,
      leadsCaptured,
      conversionsToday,
      avgResponseTime,
      containmentRate
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error fetching chatbot analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
