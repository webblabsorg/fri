import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ articles: [] })
    }

    // PostgreSQL full-text search
    const articles = await prisma.helpArticle.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { views: 'desc' },
      ],
      take: 20,
    })

    return NextResponse.json({ articles, query })
  } catch (error) {
    console.error('Error searching articles:', error)
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    )
  }
}
