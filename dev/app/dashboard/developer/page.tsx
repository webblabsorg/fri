'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, BarChart3 } from 'lucide-react'

interface APIKey {
  id: string
  name: string
  keyPrefix: string
  permissions: string[]
  rateLimit: number
  enabled: boolean
  expiresAt: string | null
  lastUsedAt: string | null
  usageCount: number
  createdAt: string
}

interface APIUsageStats {
  totalRequests: number
  last24h: number
  last7d: number
  byEndpoint: Record<string, number>
}

export default function DeveloperPortalPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [usageStats, setUsageStats] = useState<APIUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())

  // New key form
  const [newKey, setNewKey] = useState({
    name: '',
    permissions: ['tools:read', 'tools:execute'],
    rateLimit: 1000,
    expiresInDays: 0,
  })

  useEffect(() => {
    fetchAPIKeys()
    fetchUsageStats()
  }, [])

  async function fetchAPIKeys() {
    try {
      const response = await fetch('/api/api-keys')
      const data = await response.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsageStats() {
    try {
      const response = await fetch('/api/api-keys/usage')
      const data = await response.json()
      setUsageStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    }
  }

  async function createAPIKey() {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      })

      const data = await response.json()

      if (response.ok && data.key) {
        setNewKeyRevealed(data.key)
        setShowCreateModal(false)
        setNewKey({ name: '', permissions: ['tools:read', 'tools:execute'], rateLimit: 1000, expiresInDays: 0 })
        fetchAPIKeys()
      }
    } catch (error) {
      console.error('Error creating API key:', error)
    }
  }

  async function deleteAPIKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return

    try {
      await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' })
      fetchAPIKeys()
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
  }

  async function toggleAPIKey(id: string, enabled: boolean) {
    try {
      await fetch('/api/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      })
      fetchAPIKeys()
    } catch (error) {
      console.error('Error toggling API key:', error)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  const availablePermissions = [
    { value: 'tools:read', label: 'Read Tools' },
    { value: 'tools:execute', label: 'Execute Tools' },
    { value: 'documents:read', label: 'Read Documents' },
    { value: 'documents:write', label: 'Write Documents' },
    { value: 'projects:read', label: 'Read Projects' },
    { value: 'projects:write', label: 'Write Projects' },
    { value: '*', label: 'Full Access' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="w-6 h-6" />
          Developer Portal
        </h1>
        <p className="text-gray-600 mt-1">
          Manage API keys and view usage statistics
        </p>
      </div>

      {/* New Key Revealed Banner */}
      {newKeyRevealed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">API Key Created Successfully</p>
              <p className="text-sm text-green-700 mt-1">
                Copy this key now. You won&apos;t be able to see it again.
              </p>
            </div>
            <button
              onClick={() => setNewKeyRevealed(null)}
              className="text-green-600 hover:text-green-700"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-sm">
              {newKeyRevealed}
            </code>
            <button
              onClick={() => copyToClipboard(newKeyRevealed)}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Total Requests</span>
            </div>
            <p className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Last 24 Hours</span>
            </div>
            <p className="text-2xl font-bold">{usageStats.last24h.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Last 7 Days</span>
            </div>
            <p className="text-2xl font-bold">{usageStats.last7d.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="divide-y">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${key.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {key.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm text-gray-500 font-mono">{key.keyPrefix}...</code>
                      <button
                        onClick={() => {
                          const newRevealed = new Set(revealedKeys)
                          if (newRevealed.has(key.id)) {
                            newRevealed.delete(key.id)
                          } else {
                            newRevealed.add(key.id)
                          }
                          setRevealedKeys(newRevealed)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {revealedKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Rate limit: {key.rateLimit}/hr</span>
                      <span>Usage: {key.usageCount.toLocaleString()}</span>
                      {key.lastUsedAt && (
                        <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                      )}
                      {key.expiresAt && (
                        <span className={new Date(key.expiresAt) < new Date() ? 'text-red-500' : ''}>
                          Expires: {new Date(key.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.permissions.map((perm) => (
                        <span key={perm} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={key.enabled}
                        onChange={(e) => toggleAPIKey(key.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button
                      onClick={() => deleteAPIKey(key.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">API Documentation</h3>
        <p className="text-blue-800 text-sm mb-4">
          Learn how to integrate with our API to automate your legal workflows.
        </p>
        <a
          href="/docs/api"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Documentation
        </a>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="e.g., Production API Key"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                <div className="space-y-2">
                  {availablePermissions.map((perm) => (
                    <label key={perm.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newKey.permissions.includes(perm.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKey({ ...newKey, permissions: [...newKey.permissions, perm.value] })
                          } else {
                            setNewKey({ ...newKey, permissions: newKey.permissions.filter(p => p !== perm.value) })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (requests/hour)</label>
                <input
                  type="number"
                  value={newKey.rateLimit}
                  onChange={(e) => setNewKey({ ...newKey, rateLimit: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min={100}
                  max={10000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (days, 0 = never)</label>
                <input
                  type="number"
                  value={newKey.expiresInDays}
                  onChange={(e) => setNewKey({ ...newKey, expiresInDays: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min={0}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createAPIKey}
                disabled={!newKey.name || newKey.permissions.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
