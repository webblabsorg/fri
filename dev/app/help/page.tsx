'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, BookOpen, Wrench, CreditCard, AlertCircle, Code, Shield, Video } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  _count: {
    articles: number
  }
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  views: number
  helpfulVotes: number
  category: {
    name: string
    slug: string
  }
}

interface VideoTutorial {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  duration: number | null
  views: number
}

export default function HelpCenterPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [videos, setVideos] = useState<VideoTutorial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHelpData()
  }, [])

  const fetchHelpData = async () => {
    try {
      const [categoriesRes, articlesRes, videosRes] = await Promise.all([
        fetch('/api/help/categories'),
        fetch('/api/help/articles?featured=true&limit=6'),
        fetch('/api/help/videos?limit=4'),
      ])

      const categoriesData = await categoriesRes.json()
      const articlesData = await articlesRes.json()
      const videosData = await videosRes.json()

      setCategories(categoriesData.categories || [])
      setFeaturedArticles(articlesData.articles || [])
      setVideos(videosData.videos || [])
    } catch (error) {
      console.error('Error fetching help data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const getCategoryIcon = (iconString: string | null) => {
    // Map icon strings to Lucide icons
    switch (iconString) {
      case '📘':
      case '📚':
        return <BookOpen className="w-6 h-6" />
      case '🛠️':
        return <Wrench className="w-6 h-6" />
      case '💳':
      case '💰':
        return <CreditCard className="w-6 h-6" />
      case '🔧':
        return <AlertCircle className="w-6 h-6" />
      case '🔌':
        return <Code className="w-6 h-6" />
      case '🔒':
        return <Shield className="w-6 h-6" />
      default:
        return <BookOpen className="w-6 h-6" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading help center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Frith AI <span className="text-sm font-normal text-muted-foreground">Help Center</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/support/submit-ticket">
              <Button variant="outline">Submit Ticket</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Search our knowledge base or browse categories below
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg"
              />
            </div>
          </form>

          <div className="mt-4 text-sm text-muted-foreground">
            Popular: <Link href="/help/search?q=billing" className="underline hover:text-foreground">Billing</Link>,{' '}
            <Link href="/help/search?q=contract" className="underline hover:text-foreground">Contract Analysis</Link>,{' '}
            <Link href="/help/search?q=export" className="underline hover:text-foreground">Exporting Results</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 9).map((category) => (
            <Link key={category.id} href={`/help/categories/${category.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {category._count.articles} articles
                      </p>
                    </div>
                  </div>
                </CardHeader>
                {category.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Popular Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {featuredArticles.map((article) => (
                <Link key={article.id} href={`/help/articles/${article.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="text-xs text-primary font-medium mb-2">
                        {article.category.name}
                      </div>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      {article.excerpt && (
                        <CardDescription className="line-clamp-2">
                          {article.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{article.views} views</span>
                        <span>•</span>
                        <span>👍 {article.helpfulVotes}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Tutorials */}
      {videos.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Video Tutorials</h2>
            <Link href="/help/videos">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video bg-muted relative">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                  {video.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {video.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Can't find what you're looking for?</h2>
          <p className="text-lg mb-8 opacity-90">
            Our support team is here to help. Submit a ticket and we'll respond within 24 hours.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/support/submit-ticket">
              <Button size="lg" variant="secondary">
                Submit a Ticket
              </Button>
            </Link>
            <Link href="/status">
              <Button size="lg" variant="outline">
                System Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Frith AI. All rights reserved.</p>
          <div className="flex gap-4 justify-center mt-4">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/status" className="hover:text-foreground">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
