'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  id: string
  sourceType: string
  sourceUrl: string
  sourceDomain: string
  title: string
  snippet: string
  publishedDate?: string
  relevanceScore: number
  evidenceValue: string
  evidenceType?: string
  suggestedUse?: string
  keyFindings: string[]
  credibilityScore?: number
  citationBluebook?: string
}

interface SearchQuery {
  id: string
  queryText: string
  searchMode: string
  status: string
  resultCount: number
  createdAt: string
}

export default function WebSearchPage() {
  const router = useRouter()
  const [queryText, setQueryText] = useState('')
  const [searchMode, setSearchMode] = useState<'quick' | 'deep' | 'targeted'>('quick')
  const [searchType, setSearchType] = useState<string>('')
  const [sources, setSources] = useState<string[]>(['web', 'news'])
  const [jurisdiction, setJurisdiction] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentQueries, setRecentQueries] = useState<SearchQuery[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  // Load recent queries on mount
  useEffect(() => {
    loadRecentQueries()
  }, [])

  const loadRecentQueries = async () => {
    try {
      const response = await fetch('/api/web-search?limit=5')
      if (response.ok) {
        const data = await response.json()
        setRecentQueries(data.queries || [])
      }
    } catch (err) {
      console.error('Failed to load recent queries:', err)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryText.trim()) return

    setIsSearching(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryText: queryText.trim(),
          searchMode,
          searchType: searchMode === 'targeted' ? searchType : undefined,
          sources,
          jurisdiction: jurisdiction || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResults(data.results || [])
      loadRecentQueries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSource = (source: string) => {
    setSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const getEvidenceValueColor = (value: string) => {
    switch (value) {
      case 'high': return 'text-green-400 bg-green-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'low': return 'text-orange-400 bg-orange-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐'
      case 'news': return '📰'
      case 'court': return '⚖️'
      case 'gov': return '🏛️'
      default: return '📄'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Legal Web Search & Evidence Discovery</h1>
          <p className="text-gray-400">
            AI-powered search for evidence, case law, news, and public records
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Search Query</label>
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Search for evidence, cases, news, public records..."
                className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-white text-white placeholder-gray-500"
              />
            </div>

            {/* Search Mode */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Search Mode</label>
              <div className="flex gap-4">
                {(['quick', 'deep', 'targeted'] as const).map((mode) => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="searchMode"
                      value={mode}
                      checked={searchMode === mode}
                      onChange={() => setSearchMode(mode)}
                      className="text-white"
                    />
                    <span className="capitalize">{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Targeted Search Type */}
            {searchMode === 'targeted' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Search Type</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-white"
                >
                  <option value="">Select type...</option>
                  <option value="person">Person Search</option>
                  <option value="company">Company Search</option>
                  <option value="property">Property Search</option>
                  <option value="case">Case Search</option>
                </select>
              </div>
            )}

            {/* Sources */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Sources</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'web', label: 'Web', icon: '🌐' },
                  { id: 'news', label: 'News', icon: '📰' },
                  { id: 'courts', label: 'Courts', icon: '⚖️' },
                  { id: 'gov', label: 'Gov Records', icon: '🏛️' },
                  { id: 'corporate', label: 'Corporate', icon: '🏢' },
                ].map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSource(source.id)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      sources.includes(source.id)
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-gray-400 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {source.icon} {source.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jurisdiction */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Jurisdiction (Optional)</label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g., California, Federal, New York"
                className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-white text-white placeholder-gray-500"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={isSearching || !queryText.trim()}
              className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </span>
              ) : (
                '🔍 Search'
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Results ({results.length})
            </h2>
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getSourceIcon(result.sourceType)}</span>
                        <span className="text-xs text-gray-500 uppercase">{result.sourceType}</span>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-500">{result.sourceDomain}</span>
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-white hover:text-gray-300">
                        {result.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {result.snippet}
                      </p>
                      {result.keyFindings.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {result.keyFindings.slice(0, 3).map((finding, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-zinc-800 rounded text-gray-300">
                              {finding}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{result.relevanceScore}</div>
                        <div className="text-xs text-gray-500">Relevance</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getEvidenceValueColor(result.evidenceValue)}`}>
                        {result.evidenceValue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Detail Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{selectedResult.title}</h2>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Source Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{getSourceIcon(selectedResult.sourceType)} {selectedResult.sourceType}</span>
                    <span>{selectedResult.sourceDomain}</span>
                    {selectedResult.publishedDate && (
                      <span>{new Date(selectedResult.publishedDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Snippet */}
                  <div className="p-4 bg-black rounded-lg">
                    <p className="text-gray-300">{selectedResult.snippet}</p>
                  </div>

                  {/* AI Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Relevance Score</div>
                      <div className="text-3xl font-bold">{selectedResult.relevanceScore}/100</div>
                    </div>
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Evidence Value</div>
                      <div className={`text-xl font-bold uppercase ${getEvidenceValueColor(selectedResult.evidenceValue)}`}>
                        {selectedResult.evidenceValue}
                      </div>
                    </div>
                  </div>

                  {/* Key Findings */}
                  {selectedResult.keyFindings.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Findings</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {selectedResult.keyFindings.map((finding, idx) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Citation */}
                  {selectedResult.citationBluebook && (
                    <div>
                      <h3 className="font-semibold mb-2">Bluebook Citation</h3>
                      <div className="p-3 bg-black rounded-lg font-mono text-sm text-gray-300">
                        {selectedResult.citationBluebook}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-zinc-700">
                    <a
                      href={selectedResult.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Source
                    </a>
                    <button className="px-4 py-2 border border-zinc-600 rounded-lg hover:border-white transition-colors">
                      Save to Matter
                    </button>
                    <button className="px-4 py-2 border border-zinc-600 rounded-lg hover:border-white transition-colors">
                      Archive URL
                    </button>
                    <button className="px-4 py-2 border border-zinc-600 rounded-lg hover:border-white transition-colors">
                      Copy Citation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Queries */}
        {recentQueries.length > 0 && results.length === 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
            <div className="space-y-2">
              {recentQueries.map((query) => (
                <div
                  key={query.id}
                  className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors"
                >
                  <div>
                    <div className="font-medium">{query.queryText}</div>
                    <div className="text-sm text-gray-500">
                      {query.searchMode} • {query.resultCount} results • {new Date(query.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/web-search/${query.id}`}
                    className="px-3 py-1 text-sm border border-zinc-600 rounded hover:border-white transition-colors"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
