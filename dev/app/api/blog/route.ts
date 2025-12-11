import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Public Blog API
 * Returns published blog posts for the public blog pages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (slug) {
      // Get single post by slug
      const post = await prisma.blogPost.findUnique({
        where: { slug, status: 'published' },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          coverImage: true,
          publishedAt: true,
          tags: true,
          seoTitle: true,
          seoDescription: true,
        },
      })

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      return NextResponse.json({ post })
    }

    // Get list of published posts
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        tags: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}
