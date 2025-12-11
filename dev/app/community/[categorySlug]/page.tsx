'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MessageSquare, Eye, Clock, Pin, Lock, CheckCircle, ChevronLeft, Plus } from 'lucide-react'

interface ForumTopic {
  id: string
  title: string
  content: string
  authorId: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  replyCount: number
  lastReplyAt: string | null
  status: string
  createdAt: string
  category: {
    name: string
    slug: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.categorySlug as string
  
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    fetchTopics()
  }, [categorySlug, pagination.page])

  async function fetchTopics() {
    try {
      const response = await fetch(`/api/community/forum?type=topics&category=${categorySlug}&page=${pagination.page}`)
      const data = await response.json()
      setTopics(data.topics || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
      
      if (data.topics?.[0]?.category?.name) {
        setCategoryName(data.topics[0].category.name)
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <Link 
            href="/community"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Forum
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{categoryName || categorySlug}</h1>
              <p className="text-gray-500 mt-1">{pagination.total} topics</p>
            </div>
            <Link
              href={`/community/new?category=${categorySlug}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Topic
            </Link>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {topics.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No topics yet</h2>
            <p className="text-gray-500 mb-4">
              Be the first to start a discussion in this category!
            </p>
            <Link
              href={`/community/new?category=${categorySlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Topic
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm divide-y">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/community/topic/${topic.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.isPinned && (
                        <Pin className="w-4 h-4 text-blue-600" />
                      )}
                      {topic.isLocked && (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                      {topic.status === 'resolved' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {topic.content.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1" title="Replies">
                      <MessageSquare className="w-4 h-4" />
                      <span>{topic.replyCount}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Views">
                      <Eye className="w-4 h-4" />
                      <span>{topic.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1 w-20" title="Last activity">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(topic.lastReplyAt || topic.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
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
