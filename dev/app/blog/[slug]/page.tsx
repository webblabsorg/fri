import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, Share2 } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  coverImage: string | null
  publishedAt: Date | null
  tags: string[] | null
  seoTitle: string | null
  seoDescription: string | null
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
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
    return post as BlogPost | null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Frith AI
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
            <Link href="/signin" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          </nav>
        </div>
      </header>

      {/* Article */}
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8">
            <img 
              src={post.coverImage} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.publishedAt 
              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Draft'
            }
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {(post.tags as string[]).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {/* Render content - in a real app you'd use a markdown renderer */}
          {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Share */}
        <div className="border-t mt-12 pt-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Share this article</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-lg p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to transform your legal work?</h2>
          <p className="text-blue-100 mb-6">
            Join thousands of legal professionals using AI-powered tools.
          </p>
          <Link href="/signup">
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              Get Started Free
            </Button>
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Frith AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
