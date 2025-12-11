import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''
    const categoryFilter = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 2) {
      return NextResponse.json({ articles: [], query: '', count: 0 })
    }

    // Get user session for logging
    const session = await getServerSession()
    const userId = (session?.user as any)?.id

    // Build where clause
    const whereClause: any = {
      published: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Add category filter if provided
    if (categoryFilter) {
      whereClause.category = {
        slug: categoryFilter,
      }
    }

    // PostgreSQL full-text search
    const articles = await prisma.helpArticle.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      take: limit,
    })

    // Sort by relevance: title matches first, then by views
    const sortedArticles = articles.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query.toLowerCase())
      const bTitle = b.title.toLowerCase().includes(query.toLowerCase())

      if (aTitle && !bTitle) return -1
      if (!aTitle && bTitle) return 1

      // If both or neither match title, sort by featured then views
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1

      return b.views - a.views
    })

    // Log search query (async, don't await to not slow down response)
    prisma.helpSearchQuery
      .create({
        data: {
          query,
          resultsCount: articles.length,
          userId: userId || null,
        },
      })
      .catch((error) => {
        console.error('Failed to log search query:', error)
      })

    return NextResponse.json({
      articles: sortedArticles,
      query,
      count: articles.length,
    })
  } catch (error) {
    console.error('Error searching articles:', error)
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    )
  }
}
