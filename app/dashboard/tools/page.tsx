'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getAllToolConfigs, getToolsByCategory, getToolsByTier } from '@/lib/tools/tool-configs'
import { Zap, Star } from 'lucide-react'

const CATEGORIES = [
  { id: 'all', name: 'All Tools', icon: '📋' },
  { id: 'Legal Research', name: 'Legal Research', icon: '🔍' },
  { id: 'Document Drafting', name: 'Document Drafting', icon: '✍️' },
  { id: 'Contract Review', name: 'Contract Review', icon: '📄' },
  { id: 'Litigation Support', name: 'Litigation Support', icon: '⚖️' },
  { id: 'Corporate', name: 'Corporate', icon: '🏢' },
  { id: 'Employment', name: 'Employment', icon: '👔' },
  { id: 'IP', name: 'Intellectual Property', icon: '💡' },
  { id: 'Client Communication', name: 'Client Communication', icon: '💬' },
  { id: 'Real Estate', name: 'Real Estate', icon: '🏠' },
]

const TIER_FILTERS = [
  { id: 'all', name: 'All Tiers' },
  { id: 'free', name: 'Free' },
  { id: 'starter', name: 'Starter' },
  { id: 'pro', name: 'Pro' },
  { id: 'advanced', name: 'Advanced' },
]

export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get tools based on filters
  let tools = getAllToolConfigs()

  if (selectedCategory !== 'all') {
    tools = getToolsByCategory(selectedCategory)
  }

  if (selectedTier !== 'all') {
    const tierTools = getToolsByTier(selectedTier as any)
    tools = tools.filter(tool => tierTools.find(t => t.id === tool.id))
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    tools = tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    )
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'starter':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'pro':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'advanced':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Legal Tools</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {tools.length} powerful AI tools to supercharge your legal work
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Category Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tier Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tier
            </label>
            <div className="flex flex-wrap gap-2">
              {TIER_FILTERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTier === tier.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/dashboard/tools/${tool.id}`}
              className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* WOW Badge */}
              {tool.tags?.includes('wow') && (
                <div className="absolute right-4 top-4">
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
                    <Star className="h-3 w-3 fill-white" />
                    WOW
                  </span>
                </div>
              )}

              {/* Tool Header */}
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {tool.name}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getTierBadgeColor(
                      tool.requiredTier
                    )}`}
                  >
                    {tool.requiredTier.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{tool.category}</span>
                </div>
              </div>

              {/* Tool Description */}
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {tool.description}
              </p>

              {/* Tool Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{tool.estimatedTime}</span>
                </div>
                <span className="capitalize">{tool.complexity} complexity</span>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-500 transition-colors pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* No Results */}
        {tools.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No tools found matching your criteria
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedTier('all')
                setSearchQuery('')
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
