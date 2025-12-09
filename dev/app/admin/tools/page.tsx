'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit, Plus, Trash2, RefreshCw, X } from 'lucide-react'

interface Tool {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  pricingTier: string
  aiModel: string
  status: string
  popular: boolean
  featured: boolean
  promptTemplate: string
  systemPrompt?: string
  maxTokens: number
  temperature: number
  category: {
    id: string
    name: string
    slug: string
  }
  _count: {
    runs: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminToolsPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [formData, setFormData] = useState<any>({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    pricingTier: 'free',
    aiModel: 'claude-sonnet-4.5',
    promptTemplate: '',
    systemPrompt: '',
    maxTokens: 4000,
    temperature: 0.7,
    status: 'active',
    popular: false,
    featured: false,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTools()
    fetchCategories()
  }, [])

  const fetchTools = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/tools')
      if (response.ok) {
        const data = await response.json()
        setTools(data.tools)
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/tools/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleOpenModal = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool)
      setFormData({
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        categoryId: tool.categoryId,
        pricingTier: tool.pricingTier,
        aiModel: tool.aiModel,
        promptTemplate: tool.promptTemplate,
        systemPrompt: tool.systemPrompt || '',
        maxTokens: tool.maxTokens,
        temperature: tool.temperature,
        status: tool.status,
        popular: tool.popular,
        featured: tool.featured,
      })
    } else {
      setEditingTool(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        categoryId: categories[0]?.id || '',
        pricingTier: 'free',
        aiModel: 'claude-sonnet-4.5',
        promptTemplate: '',
        systemPrompt: '',
        maxTokens: 4000,
        temperature: 0.7,
        status: 'active',
        popular: false,
        featured: false,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTool(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingTool 
        ? `/api/admin/tools/${editingTool.id}`
        : '/api/admin/tools'
      
      const method = editingTool ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert(editingTool ? 'Tool updated successfully' : 'Tool created successfully')
        handleCloseModal()
        fetchTools()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save tool')
      }
    } catch (error) {
      console.error('Failed to save tool:', error)
      alert('Failed to save tool')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (toolId: string, toolName: string) => {
    if (!confirm(`Are you sure you want to deprecate "${toolName}"?`)) return

    try {
      const response = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Tool deprecated successfully')
        fetchTools()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete tool')
      }
    } catch (error) {
      console.error('Failed to delete tool:', error)
      alert('Failed to delete tool')
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Legal Research': 'bg-blue-100 text-blue-800',
      'Document Drafting': 'bg-green-100 text-green-800',
      'Contract Review': 'bg-purple-100 text-purple-800',
      'Client Communication': 'bg-orange-100 text-orange-800',
      'Litigation Support': 'bg-red-100 text-red-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const activeTools = tools.filter(t => t.status === 'active')
  const uniqueCategories = new Set(tools.map(t => t.category.name))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tool Management</h1>
          <p className="text-gray-600">Manage AI tools and their configurations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTools} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Tool
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tools.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeTools.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{uniqueCategories.size}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {tools.reduce((sum, t) => sum + t._count.runs, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tools List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tools</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tools...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="p-4 border rounded-md hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{tool.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tool.status === 'active' ? 'bg-green-100 text-green-800' :
                        tool.status === 'beta' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tool.status}
                      </span>
                      {tool.popular && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(tool.category.name)}`}>
                        {tool.category.name}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 capitalize">
                        {tool.pricingTier}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {tool._count.runs} runs
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleOpenModal(tool)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600"
                      onClick={() => handleDelete(tool.id, tool.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Deprecate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Tool Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {editingTool ? 'Edit Tool' : 'Create New Tool'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug *</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    placeholder="tool-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pricing Tier *</label>
                  <select
                    value={formData.pricingTier}
                    onChange={(e) => setFormData({ ...formData, pricingTier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">AI Model</label>
                  <select
                    value={formData.aiModel}
                    onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
                    <option value="claude-opus-4">Claude Opus 4</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="beta">Beta</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prompt Template *</label>
                <textarea
                  value={formData.promptTemplate}
                  onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                  rows={4}
                  placeholder="The prompt template with {{placeholders}}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">System Prompt (Optional)</label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Tokens</label>
                  <Input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Temperature</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2 pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.popular}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    />
                    <span className="text-sm">Popular</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingTool ? 'Update Tool' : 'Create Tool'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
