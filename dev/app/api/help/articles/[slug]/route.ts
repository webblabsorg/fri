import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const article = await prisma.helpArticle.findUnique({
      where: {
        slug,
        published: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.helpArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    })

    // Get related articles if IDs provided
    let relatedArticles = []
    if (article.relatedArticles && Array.isArray(article.relatedArticles)) {
      relatedArticles = await prisma.helpArticle.findMany({
        where: {
          id: { in: article.relatedArticles as string[] },
          published: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
        },
        take: 3,
      })
    }

    return NextResponse.json({
      article: {
        ...article,
        views: article.views + 1,
      },
      relatedArticles,
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const body = await request.json()
    const { action, helpful } = body

    if (action === 'vote') {
      const article = await prisma.helpArticle.findUnique({
        where: { slug },
      })

      if (!article) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        )
      }

      await prisma.helpArticle.update({
        where: { slug },
        data: helpful
          ? { helpfulVotes: { increment: 1 } }
          : { notHelpfulVotes: { increment: 1 } },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}
