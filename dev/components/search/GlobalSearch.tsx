'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

interface SearchResult {
  type: 'tool' | 'project' | 'template' | 'history'
  id: string
  title: string
  description: string
  category?: string
  status?: string
  date?: string
  url: string
}

interface SearchResults {
  tools: SearchResult[]
  projects: SearchResult[]
  templates: SearchResult[]
  history: SearchResult[]
  total: number
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults(null)
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null)
      return
    }

    const timer = setTimeout(() => {
      performSearch(query)
    }, 300) // Debounce

    return () => clearTimeout(timer)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const allResults: SearchResult[] = results
    ? [...results.tools, ...results.projects, ...results.templates, ...results.history]
    : []

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault()
      navigateToResult(allResults[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const navigateToResult = (result: SearchResult) => {
    router.push(result.url)
    onClose()
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'tool':
        return '🔧'
      case 'project':
        return '📁'
      case 'template':
        return '📝'
      case 'history':
        return '🕒'
      default:
        return '📄'
    }
  }

  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'tool':
        return 'bg-blue-100 text-blue-700'
      case 'project':
        return 'bg-purple-100 text-purple-700'
      case 'template':
        return 'bg-green-100 text-green-700'
      case 'history':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 pt-[10vh]">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[70vh] overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tools, projects, templates, history..."
              className="pl-12 text-lg h-12"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Use ↑↓ to navigate, ↵ to select, ESC to close</span>
            {loading && <span>Searching...</span>}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {!query || query.length < 2 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>Start typing to search...</p>
              <p className="text-xs mt-2">Search across tools, projects, templates, and history</p>
            </div>
          ) : results && results.total === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🤷</div>
              <p>No results found for "{query}"</p>
              <p className="text-xs mt-2">Try a different search term</p>
            </div>
          ) : results ? (
            <div className="py-2">
              {/* Tools */}
              {results.tools.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Tools ({results.tools.length})
                  </div>
                  {results.tools.map((result, index) => {
                    const globalIndex = index
                    return (
                      <button
                        key={result.id}
                        onClick={() => navigateToResult(result)}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-2xl">{getResultIcon(result.type)}</span>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getResultBadgeColor(result.type)}`}>
                              {result.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {result.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Projects */}
              {results.projects.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Projects ({results.projects.length})
                  </div>
                  {results.projects.map((result, index) => {
                    const globalIndex = results.tools.length + index
                    return (
                      <button
                        key={result.id}
                        onClick={() => navigateToResult(result)}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-2xl">{getResultIcon(result.type)}</span>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.title}</span>
                            {result.status && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                {result.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {result.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Templates */}
              {results.templates.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Templates ({results.templates.length})
                  </div>
                  {results.templates.map((result, index) => {
                    const globalIndex = results.tools.length + results.projects.length + index
                    return (
                      <button
                        key={result.id}
                        onClick={() => navigateToResult(result)}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-2xl">{getResultIcon(result.type)}</span>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.title}</span>
                            {result.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                {result.category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {result.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* History */}
              {results.history.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    History ({results.history.length})
                  </div>
                  {results.history.map((result, index) => {
                    const globalIndex =
                      results.tools.length + results.projects.length + results.templates.length + index
                    return (
                      <button
                        key={result.id}
                        onClick={() => navigateToResult(result)}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                          selectedIndex === globalIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-2xl">{getResultIcon(result.type)}</span>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.title}</span>
                            {result.date && (
                              <span className="text-xs text-gray-500">
                                {new Date(result.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {result.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
