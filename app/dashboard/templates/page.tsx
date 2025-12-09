'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Template {
  id: string
  toolId: string
  name: string
  description?: string
  category?: string
  useCount: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))]
  
  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory)

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Templates</h1>
        <p className="text-gray-600">
          Saved input templates for quick reuse
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No Templates Yet</h2>
          <p className="text-gray-600 mb-6">
            Save your first template from any tool to reuse inputs later
          </p>
          <Link href="/dashboard/tools">
            <Button>Browse Tools</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-2">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  {template.category && (
                    <span className="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {template.category}
                    </span>
                  )}
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Used {template.useCount} times</span>
                <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/dashboard/tools/${template.toolId}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Use
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTemplate(template.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {templates.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-600">
          {templates.length} template{templates.length !== 1 ? 's' : ''} saved •{' '}
          Total uses: {templates.reduce((sum, t) => sum + t.useCount, 0)}
        </div>
      )}
    </div>
  )
}
