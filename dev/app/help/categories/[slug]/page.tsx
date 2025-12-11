'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  views: number
  helpfulVotes: number
  updatedAt: string
}

interface Category {
  id: string
  name: string
  description: string | null
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [category, setCategory] = useState<Category | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategoryData()
  }, [slug])

  const fetchCategoryData = async () => {
    try {
      // Get category info
      const categoriesRes = await fetch('/api/help/categories')
      const categoriesData = await categoriesRes.json()
      const currentCategory = categoriesData.categories?.find(
        (c: any) => c.slug === slug
      )

      if (!currentCategory) {
        router.push('/help')
        return
      }

      setCategory(currentCategory)

      // Get articles for this category
      const articlesRes = await fetch(`/api/help/articles?categoryId=${currentCategory.id}`)
      const articlesData = await articlesRes.json()
      setArticles(articlesData.articles || [])
    } catch (error) {
      console.error('Error fetching category data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(searchQuery)}&category=${slug}`)
    }
  }

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading category...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/help" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Help Center
          </Link>
        </div>
      </header>

      {/* Category Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">{category?.name}</h1>
          {category?.description && (
            <p className="text-lg text-muted-foreground mb-8">{category.description}</p>
          )}

          {/* Search within category */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search in this category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-5"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Articles List */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No articles found in this category.</p>
              <Link href="/help">
                <Button variant="outline" className="mt-4">
                  Browse All Categories
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Link key={article.id} href={`/help/articles/${article.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-xl">{article.title}</CardTitle>
                    {article.excerpt && (
                      <CardDescription className="line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{article.views} views</span>
                      <span>•</span>
                      <span>👍 {article.helpfulVotes}</span>
                      <span>•</span>
                      <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
