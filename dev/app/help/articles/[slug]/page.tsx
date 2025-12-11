'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ThumbsUp, ThumbsDown, Eye, Calendar, Share2, Printer } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  views: number
  helpfulVotes: number
  notHelpfulVotes: number
  updatedAt: string
  videoUrl: string | null
  relatedArticles: any
  category: {
    id: string
    name: string
    slug: string
  }
}

interface RelatedArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
}

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])

  useEffect(() => {
    fetchArticle()
  }, [slug])

  useEffect(() => {
    if (article) {
      extractHeadings(article.content)
    }
  }, [article])

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/help/articles/${slug}`)
      
      if (!response.ok) {
        router.push('/help')
        return
      }

      const data = await response.json()
      setArticle(data.article)

      // Parse related articles if they exist
      if (data.article.relatedArticles) {
        const related = Array.isArray(data.article.relatedArticles)
          ? data.article.relatedArticles
          : JSON.parse(data.article.relatedArticles || '[]')
        setRelatedArticles(related.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      router.push('/help')
    } finally {
      setIsLoading(false)
    }
  }

  const extractHeadings = (content: string) => {
    // Simple regex to extract markdown headings
    const headingRegex = /^(#{2,3})\s+(.+)$/gm
    const matches = [...content.matchAll(headingRegex)]
    
    const extractedHeadings = matches.map((match, index) => ({
      id: `heading-${index}`,
      text: match[2],
      level: match[1].length,
    }))

    setHeadings(extractedHeadings)
  }

  const handleVote = async (helpful: boolean) => {
    if (hasVoted) return

    try {
      const response = await fetch(`/api/help/articles/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', helpful }),
      })

      if (response.ok) {
        setHasVoted(true)
        
        // Update local vote counts
        if (article) {
          setArticle({
            ...article,
            helpfulVotes: helpful ? article.helpfulVotes + 1 : article.helpfulVotes,
            notHelpfulVotes: !helpful ? article.notHelpfulVotes + 1 : article.notHelpfulVotes,
          })
        }

        // If not helpful, show feedback form
        if (!helpful) {
          setShowFeedbackForm(true)
        }
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return

    try {
      await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'general',
          subject: `Feedback on article: ${article?.title}`,
          message: feedbackText,
          page: `/help/articles/${slug}`,
        }),
      })

      setShowFeedbackForm(false)
      setFeedbackText('')
      alert('Thank you for your feedback!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: article?.title, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  const renderContent = (content: string) => {
    // Simple markdown rendering (you'd want a proper markdown parser in production)
    return content
      .split('\n')
      .map((line, index) => {
        // Headings
        if (line.startsWith('###')) {
          const text = line.replace(/^###\s+/, '')
          return <h3 key={index} className="text-xl font-semibold mt-6 mb-3" id={`heading-${headings.findIndex(h => h.text === text)}`}>{text}</h3>
        }
        if (line.startsWith('##')) {
          const text = line.replace(/^##\s+/, '')
          return <h2 key={index} className="text-2xl font-semibold mt-8 mb-4" id={`heading-${headings.findIndex(h => h.text === text)}`}>{text}</h2>
        }
        // Paragraphs
        if (line.trim()) {
          return <p key={index} className="mb-4 leading-relaxed">{line}</p>
        }
        return null
      })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!article) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/help" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Help Center
            </Link>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground mb-4">
              <Link href="/help" className="hover:text-foreground">Help Center</Link>
              {' / '}
              <Link href={`/help/categories/${article.category.slug}`} className="hover:text-foreground">
                {article.category.name}
              </Link>
            </div>

            {/* Title & Meta */}
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Updated {new Date(article.updatedAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.views} views
              </span>
            </div>

            {/* Video if present */}
            {article.videoUrl && (
              <div className="mb-8">
                <div className="aspect-video bg-muted rounded-lg">
                  <iframe
                    src={article.videoUrl}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Article Body */}
            <div className="prose prose-lg max-w-none">
              {renderContent(article.content)}
            </div>

            {/* Voting */}
            <div className="border-t border-b py-8 my-8">
              <h3 className="text-lg font-semibold mb-4">Was this article helpful?</h3>
              {!hasVoted ? (
                <div className="flex gap-4">
                  <Button onClick={() => handleVote(true)} variant="outline">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Yes ({article.helpfulVotes})
                  </Button>
                  <Button onClick={() => handleVote(false)} variant="outline">
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    No ({article.notHelpfulVotes})
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Thank you for your feedback!</p>
              )}

              {/* Feedback Form */}
              {showFeedbackForm && (
                <div className="mt-6 space-y-4">
                  <p className="text-sm font-medium">Tell us how we can improve this article:</p>
                  <Textarea
                    placeholder="Your feedback..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
                </div>
              )}
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold mb-4">Related Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedArticles.map((related) => (
                    <Link key={related.id} href={`/help/articles/${related.slug}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader>
                          <CardTitle className="text-base">{related.title}</CardTitle>
                          {related.excerpt && (
                            <CardDescription className="line-clamp-2 text-xs">
                              {related.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <Card className="mt-8 bg-muted/50">
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
                <p className="text-muted-foreground mb-4">
                  Submit a support ticket and our team will get back to you within 24 hours.
                </p>
                <Link href="/support/submit-ticket">
                  <Button>Submit a Ticket</Button>
                </Link>
              </CardContent>
            </Card>
          </article>

          {/* Sidebar - Table of Contents */}
          <aside className="lg:col-span-1 print:hidden">
            {headings.length > 0 && (
              <div className="sticky top-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">On This Page</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <nav className="space-y-2">
                      {headings.map((heading) => (
                        <a
                          key={heading.id}
                          href={`#${heading.id}`}
                          className={`block text-sm hover:text-primary transition-colors ${
                            heading.level === 3 ? 'pl-4' : ''
                          }`}
                        >
                          {heading.text}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
