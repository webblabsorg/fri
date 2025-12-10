import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/db'

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
    const query = searchParams.get('q')?.toLowerCase() || ''

    if (!query || query.length < 2) {
      return NextResponse.json({
        users: [],
        tickets: [],
        tools: [],
        transactions: [],
      })
    }

    // Search Users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        status: true,
      },
      take: 5,
    })

    // Search Support Tickets
    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { 
            messages: { 
              some: { 
                message: { contains: query, mode: 'insensitive' } 
              } 
            } 
          },
        ],
      },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 5,
    })

    // Search Tools
    const tools = await prisma.tool.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    })

    // Search Transactions (by user email)
    const transactions = await prisma.transaction.findMany({
      where: {
        user: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 5,
    })

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        type: 'user',
        link: `/admin/users/${u.id}`,
      })),
      tickets: tickets.map((t) => ({
        ...t,
        type: 'ticket',
        link: `/admin/support/${t.id}`,
      })),
      tools: tools.map((t) => ({
        ...t,
        type: 'tool',
        link: `/admin/tools`,
      })),
      transactions: transactions.map((t) => ({
        ...t,
        type: 'transaction',
        link: `/admin/users/${t.user}`,
      })),
      totalResults:
        users.length + tickets.length + tools.length + transactions.length,
    })
  } catch (error) {
    console.error('Admin search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
