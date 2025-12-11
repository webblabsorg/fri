'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ToolRun {
  id: string
  toolName: string
  toolSlug: string
  inputText: string
  outputText?: string
  status: string
  aiModelUsed: string
  tokensUsed?: number
  evaluationScore?: number
  createdAt: string
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<ToolRun[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchHistory()
  }, [filter])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/ai/history?filter=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setRuns(data.runs || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteRun = async (runId: string) => {
    if (!confirm('Delete this run?')) return

    try {
      const response = await fetch(`/api/ai/history/${runId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRuns(runs.filter(run => run.id !== runId))
      }
    } catch (error) {
      console.error('Failed to delete run:', error)
    }
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tool Run History</h1>
        <p className="text-gray-600">View and manage your AI tool execution history</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Runs
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completed
          </Button>
          <Button
            variant={filter === 'failed' ? 'default' : 'outline'}
            onClick={() => setFilter('failed')}
            size="sm"
          >
            Failed
          </Button>
        </div>

        {/* History List */}
        {runs.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">No History Yet</h2>
            <p className="text-gray-600 mb-6">
              Your tool run history will appear here
            </p>
            <Link href="/dashboard/tools">
              <Button>Browse Tools</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <Card key={run.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/dashboard/tools/${run.toolSlug}`}
                        className="text-lg font-semibold hover:text-blue-600"
                      >
                        {run.toolName}
                      </Link>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          run.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : run.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {run.inputText.substring(0, 200)}...
                    </p>

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Model: {run.aiModelUsed}</span>
                      {run.tokensUsed && <span>Tokens: {run.tokensUsed}</span>}
                      {run.evaluationScore !== undefined && (
                        <span className="flex items-center gap-1">
                          Quality:
                          <span
                            className={`font-medium ${
                              run.evaluationScore >= 85
                                ? 'text-green-600'
                                : run.evaluationScore >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {run.evaluationScore}/100
                          </span>
                        </span>
                      )}
                      <span>{new Date(run.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/tools/${run.toolSlug}?runId=${run.id}`}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRun(run.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
