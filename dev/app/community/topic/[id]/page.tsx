'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  MessageSquare, 
  Eye, 
  Clock, 
  Pin, 
  Lock, 
  CheckCircle, 
  ChevronLeft,
  ThumbsUp,
  Send,
  MoreVertical
} from 'lucide-react'

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
  replies: ForumReply[]
}

interface ForumReply {
  id: string
  authorId: string
  content: string
  isAccepted: boolean
  upvotes: number
  createdAt: string
  updatedAt: string
}

export default function TopicPage() {
  const params = useParams()
  const topicId = params.id as string
  
  const [topic, setTopic] = useState<ForumTopic | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTopic()
  }, [topicId])

  async function fetchTopic() {
    try {
      const response = await fetch(`/api/community/forum?type=topic&topicId=${topicId}`)
      const data = await response.json()
      setTopic(data.topic || null)
    } catch (error) {
      console.error('Error fetching topic:', error)
    } finally {
      setLoading(false)
    }
  }

  async function submitReply() {
    if (!replyContent.trim() || !topic) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/community/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reply',
          topicId: topic.id,
          content: replyContent,
        }),
      })

      if (response.ok) {
        setReplyContent('')
        fetchTopic()
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString()
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

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Topic not found</h2>
            <Link href="/community" className="text-blue-600 hover:text-blue-700">
              Return to forum
            </Link>
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
            href={`/community/${topic.category.slug}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {topic.category.name}
          </Link>
          <div className="flex items-start gap-2">
            {topic.isPinned && <Pin className="w-5 h-5 text-blue-600 mt-1" />}
            {topic.isLocked && <Lock className="w-5 h-5 text-gray-400 mt-1" />}
            {topic.status === 'resolved' && <CheckCircle className="w-5 h-5 text-green-600 mt-1" />}
            <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {topic.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {topic.replyCount} replies
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(topic.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Original Post */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">U</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">User</span>
                <span className="text-sm text-gray-500">{formatDate(topic.createdAt)}</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{topic.content}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {topic.replies.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {topic.replies.length} {topic.replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
            {topic.replies.map((reply) => (
              <div 
                key={reply.id} 
                className={`bg-white rounded-lg border shadow-sm p-6 ${reply.isAccepted ? 'border-green-500 border-2' : ''}`}
              >
                {reply.isAccepted && (
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
                    <CheckCircle className="w-4 h-4" />
                    Accepted Answer
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">U</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">User</span>
                      <span className="text-sm text-gray-500">{formatDate(reply.createdAt)}</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{reply.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                        <ThumbsUp className="w-4 h-4" />
                        {reply.upvotes}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {!topic.isLocked ? (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add a Reply</h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={submitReply}
                disabled={!replyContent.trim() || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
            <Lock className="w-5 h-5 mx-auto mb-2" />
            This topic is locked. No new replies can be added.
          </div>
        )}
      </div>
    </div>
  )
}
