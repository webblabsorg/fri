'use client'

import { useState, useEffect, use } from 'react'
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
  suggestedActions: string[]
  credibilityScore?: number
  biasIndicators: string[]
  admissibilityNotes?: {
    hearsay: string
    authentication: string
    bestEvidence: string
    privilege: string
  }
  citationBluebook?: string
  citationAlwd?: string
  archivedUrl?: string
  isSaved: boolean
  userNotes?: string
  userTags: string[]
}

interface SearchQuery {
  id: string
  queryText: string
  searchMode: string
  searchType?: string
  sources: string[]
  jurisdiction?: string
  expandedQuery?: string
  relatedTerms: string[]
  resultCount: number
  status: string
  createdAt: string
  completedAt?: string
  results: SearchResult[]
}

export default function WebSearchQueryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [query, setQuery] = useState<SearchQuery | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)

  useEffect(() => {
    loadQuery()
  }, [id])

  const loadQuery = async () => {
    try {
      const response = await fetch(`/api/web-search/queries/${id}`)
      if (!response.ok) {
        throw new Error('Query not found')
      }
      const data = await response.json()
      setQuery(data.query)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load query')
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async (resultId: string) => {
    setArchiving(resultId)
    try {
      const response = await fetch(`/api/web-search/results/${resultId}/archive`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        // Update the result in state
        setQuery(prev => {
          if (!prev) return prev
          return {
            ...prev,
            results: prev.results.map(r =>
              r.id === resultId ? { ...r, archivedUrl: data.archivedUrl } : r
            ),
          }
        })
      }
    } catch (err) {
      console.error('Archive error:', err)
    } finally {
      setArchiving(null)
    }
  }

  const handleCopyCitation = async (resultId: string, format: 'bluebook' | 'alwd') => {
    setCopying(resultId)
    try {
      const response = await fetch(`/api/web-search/results/${resultId}/cite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })
      if (response.ok) {
        const data = await response.json()
        await navigator.clipboard.writeText(data.citation)
        alert('Citation copied to clipboard!')
      }
    } catch (err) {
      console.error('Citation error:', err)
    } finally {
      setCopying(null)
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !query) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-red-400">{error || 'Query not found'}</p>
            <Link href="/dashboard/web-search" className="mt-4 inline-block text-white underline">
              ← Back to Web Search
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/web-search" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to Web Search
          </Link>
          <h1 className="text-2xl font-bold mb-2">Search Results</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>Query: <span className="text-white">{query.queryText}</span></span>
            <span>Mode: <span className="text-white capitalize">{query.searchMode}</span></span>
            <span>Results: <span className="text-white">{query.resultCount}</span></span>
            <span>Date: <span className="text-white">{new Date(query.createdAt).toLocaleString()}</span></span>
          </div>
          {query.expandedQuery && query.expandedQuery !== query.queryText && (
            <div className="mt-2 text-sm">
              <span className="text-gray-400">AI-expanded query: </span>
              <span className="text-gray-300">{query.expandedQuery}</span>
            </div>
          )}
          {query.relatedTerms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-sm text-gray-400">Related terms:</span>
              {query.relatedTerms.map((term, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-zinc-800 rounded text-gray-300">
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {query.results.map((result) => (
            <div
              key={result.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getSourceIcon(result.sourceType)}</span>
                    <span className="text-xs text-gray-500 uppercase">{result.sourceType}</span>
                    <span className="text-xs text-gray-600">|</span>
                    <span className="text-xs text-gray-500">{result.sourceDomain}</span>
                    {result.publishedDate && (
                      <>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.publishedDate).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {result.archivedUrl && (
                      <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded">
                        Archived
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-300"
                    >
                      {result.title}
                    </a>
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {result.snippet}
                  </p>
                  
                  {/* Key Findings */}
                  {result.keyFindings.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Key Findings:</div>
                      <div className="flex flex-wrap gap-2">
                        {result.keyFindings.map((finding, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-zinc-800 rounded text-gray-300">
                            {finding}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {result.suggestedActions.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Suggested Actions:</div>
                      <ul className="list-disc list-inside text-xs text-gray-400">
                        {result.suggestedActions.slice(0, 3).map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Admissibility Notes */}
                  {result.admissibilityNotes && (
                    <div className="mb-3 p-3 bg-zinc-800/50 rounded">
                      <div className="text-xs text-gray-500 mb-2">Admissibility Analysis:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {result.admissibilityNotes.hearsay && (
                          <div>
                            <span className="text-yellow-400">⚠️ Hearsay:</span>{' '}
                            <span className="text-gray-400">{result.admissibilityNotes.hearsay}</span>
                          </div>
                        )}
                        {result.admissibilityNotes.authentication && (
                          <div>
                            <span className="text-blue-400">🔐 Auth:</span>{' '}
                            <span className="text-gray-400">{result.admissibilityNotes.authentication}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs bg-white text-black rounded hover:bg-gray-200 transition-colors"
                    >
                      View Source
                    </a>
                    <button
                      onClick={() => handleArchive(result.id)}
                      disabled={!!result.archivedUrl || archiving === result.id}
                      className="px-3 py-1 text-xs border border-zinc-600 rounded hover:border-white transition-colors disabled:opacity-50"
                    >
                      {archiving === result.id ? 'Archiving...' : result.archivedUrl ? 'Archived ✓' : 'Archive URL'}
                    </button>
                    <button
                      onClick={() => handleCopyCitation(result.id, 'bluebook')}
                      disabled={copying === result.id}
                      className="px-3 py-1 text-xs border border-zinc-600 rounded hover:border-white transition-colors"
                    >
                      {copying === result.id ? 'Copying...' : 'Copy Bluebook'}
                    </button>
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="px-3 py-1 text-xs border border-zinc-600 rounded hover:border-white transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex flex-col items-end gap-2 min-w-[100px]">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{result.relevanceScore}</div>
                    <div className="text-xs text-gray-500">Relevance</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getEvidenceValueColor(result.evidenceValue)}`}>
                    {result.evidenceValue}
                  </span>
                  {result.credibilityScore && (
                    <div className="text-right">
                      <div className="text-sm font-medium">{result.credibilityScore}%</div>
                      <div className="text-xs text-gray-500">Credibility</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Result Detail Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold pr-8">{selectedResult.title}</h2>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
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

                  {/* AI Analysis Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Relevance</div>
                      <div className="text-3xl font-bold">{selectedResult.relevanceScore}/100</div>
                    </div>
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Evidence Value</div>
                      <div className={`text-xl font-bold uppercase ${getEvidenceValueColor(selectedResult.evidenceValue)}`}>
                        {selectedResult.evidenceValue}
                      </div>
                      {selectedResult.evidenceType && (
                        <div className="text-xs text-gray-500 mt-1">{selectedResult.evidenceType}</div>
                      )}
                    </div>
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Credibility</div>
                      <div className="text-3xl font-bold">{selectedResult.credibilityScore || 'N/A'}%</div>
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

                  {/* Suggested Actions */}
                  {selectedResult.suggestedActions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Suggested Actions</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {selectedResult.suggestedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Admissibility Analysis */}
                  {selectedResult.admissibilityNotes && (
                    <div>
                      <h3 className="font-semibold mb-2">Admissibility Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-zinc-800 rounded">
                          <div className="text-sm font-medium text-yellow-400 mb-1">⚠️ Hearsay</div>
                          <p className="text-sm text-gray-400">{selectedResult.admissibilityNotes.hearsay || 'No concerns'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800 rounded">
                          <div className="text-sm font-medium text-blue-400 mb-1">🔐 Authentication</div>
                          <p className="text-sm text-gray-400">{selectedResult.admissibilityNotes.authentication || 'Standard requirements'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800 rounded">
                          <div className="text-sm font-medium text-purple-400 mb-1">📄 Best Evidence</div>
                          <p className="text-sm text-gray-400">{selectedResult.admissibilityNotes.bestEvidence || 'No concerns'}</p>
                        </div>
                        <div className="p-3 bg-zinc-800 rounded">
                          <div className="text-sm font-medium text-red-400 mb-1">🔒 Privilege</div>
                          <p className="text-sm text-gray-400">{selectedResult.admissibilityNotes.privilege || 'No concerns'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bias Indicators */}
                  {selectedResult.biasIndicators.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Bias Indicators</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.biasIndicators.map((indicator, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-900/30 text-orange-400 rounded text-sm">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Citations */}
                  <div>
                    <h3 className="font-semibold mb-2">Citations</h3>
                    {selectedResult.citationBluebook && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Bluebook:</div>
                        <div className="p-3 bg-black rounded-lg font-mono text-sm text-gray-300">
                          {selectedResult.citationBluebook}
                        </div>
                      </div>
                    )}
                    {selectedResult.citationAlwd && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">ALWD:</div>
                        <div className="p-3 bg-black rounded-lg font-mono text-sm text-gray-300">
                          {selectedResult.citationAlwd}
                        </div>
                      </div>
                    )}
                  </div>

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
                    {selectedResult.archivedUrl && (
                      <a
                        href={selectedResult.archivedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-green-600 text-green-400 rounded-lg hover:bg-green-900/20 transition-colors"
                      >
                        View Archived
                      </a>
                    )}
                    <button
                      onClick={() => handleCopyCitation(selectedResult.id, 'bluebook')}
                      className="px-4 py-2 border border-zinc-600 rounded-lg hover:border-white transition-colors"
                    >
                      Copy Bluebook Citation
                    </button>
                    <button
                      onClick={() => handleCopyCitation(selectedResult.id, 'alwd')}
                      className="px-4 py-2 border border-zinc-600 rounded-lg hover:border-white transition-colors"
                    >
                      Copy ALWD Citation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
