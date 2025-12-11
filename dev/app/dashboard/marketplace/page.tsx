'use client'

import { useState, useEffect } from 'react'
import { Search, Star, Download, Filter, ChevronRight } from 'lucide-react'

interface MarketplaceTool {
  id: string
  slug: string
  name: string
  description: string
  category: string
  icon: string | null
  pricing: string
  pricePerRun: number | null
  monthlyPrice: number | null
  installCount: number
  rating: number | null
  reviewCount: number
}

interface Category {
  name: string
  count: number
}

export default function MarketplacePage() {
  const [tools, setTools] = useState<MarketplaceTool[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTools()
  }, [search, selectedCategory, page])

  async function fetchTools() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory) params.set('category', selectedCategory)
      params.set('page', page.toString())

      const response = await fetch(`/api/marketplace?${params}`)
      const data = await response.json()
      
      setTools(data.tools || [])
      setCategories(data.categories || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Error fetching marketplace:', error)
    } finally {
      setLoading(false)
    }
  }

  function getPricingBadge(tool: MarketplaceTool) {
    if (tool.pricing === 'free') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Free</span>
    }
    if (tool.pricing === 'freemium') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Freemium</span>
    }
    if (tool.monthlyPrice) {
      return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">${tool.monthlyPrice}/mo</span>
    }
    if (tool.pricePerRun) {
      return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">${tool.pricePerRun}/run</span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Paid</span>
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tool Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Discover and install third-party tools to extend your workflow
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search tools..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPage(1)
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Tools Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border shadow-sm p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
            <p className="text-gray-500">No tools found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔧</span>
                  </div>
                  {getPricingBadge(tool)}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{tool.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{tool.installCount}</span>
                  </div>
                  {tool.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{tool.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({tool.reviewCount})</span>
                    </div>
                  )}
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
