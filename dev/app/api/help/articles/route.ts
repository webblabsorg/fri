import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      published: true,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (featured === 'true') {
      where.featured = true
    }

    const articles = await prisma.helpArticle.findMany({
      where,
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
      take: limit,
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
