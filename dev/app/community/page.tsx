'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Users, Clock, ChevronRight, Plus } from 'lucide-react'

interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
  _count: {
    topics: number
  }
}

export default function CommunityPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const response = await fetch('/api/community/forum?type=categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
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
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
              <p className="text-gray-600 mt-2">
                Connect with other users, share tips, and get help from the community
              </p>
            </div>
            <Link
              href="/community/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Topic
            </Link>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {categories.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h2>
            <p className="text-gray-500">
              The community forum is being set up. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/community/${category.slug}`}
                className="block bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                      {category.description && (
                        <p className="text-gray-500 text-sm mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{category._count.topics}</p>
                      <p className="text-xs text-gray-500">topics</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">--</p>
            <p className="text-sm text-gray-500">Members</p>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {categories.reduce((sum, c) => sum + c._count.topics, 0)}
            </p>
            <p className="text-sm text-gray-500">Topics</p>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">--</p>
            <p className="text-sm text-gray-500">Replies Today</p>
          </div>
        </div>
      </div>
    </div>
  )
}
