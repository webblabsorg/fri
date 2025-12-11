'use client'

import { useState, useEffect } from 'react'
import { Link2, CheckCircle, XCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react'

interface Integration {
  type: string
  name: string
  description: string
  icon: string
  connected: boolean
  integration: {
    id: string
    type: string
    name: string
    enabled: boolean
    status: string
    lastSyncAt: string | null
    errorMsg: string | null
    createdAt: string
  } | null
}

interface Organization {
  id: string
  name: string
  planTier: string
}

export default function IntegrationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchIntegrations()
    }
  }, [selectedOrg])

  async function fetchOrganizations() {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  async function fetchIntegrations() {
    setLoading(true)
    try {
      const response = await fetch(`/api/integrations?organizationId=${selectedOrg}`)
      const data = await response.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function connectIntegration(type: string, name: string) {
    setConnecting(type)
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          type,
          name,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.oauthUrl) {
          // Redirect to OAuth flow
          window.open(data.oauthUrl, '_blank')
        }
        fetchIntegrations()
      }
    } catch (error) {
      console.error('Error connecting integration:', error)
    } finally {
      setConnecting(null)
    }
  }

  async function disconnectIntegration(id: string) {
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    try {
      await fetch(`/api/integrations?id=${id}&organizationId=${selectedOrg}`, {
        method: 'DELETE',
      })
      fetchIntegrations()
    } catch (error) {
      console.error('Error disconnecting integration:', error)
    }
  }

  async function toggleIntegration(id: string, enabled: boolean) {
    try {
      await fetch('/api/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          organizationId: selectedOrg,
          enabled,
        }),
      })
      fetchIntegrations()
    } catch (error) {
      console.error('Error toggling integration:', error)
    }
  }

  function getIconComponent(icon: string) {
    // Simple icon mapping - in production, use actual brand icons
    return <Link2 className="w-8 h-8" />
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'connected':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Connected</span>
      case 'error':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Error</span>
      case 'disconnected':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Disconnected</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{status}</span>
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Link2 className="w-6 h-6" />
          Integrations
        </h1>
        <p className="text-gray-600 mt-1">
          Connect third-party services to enhance your workflow
        </p>
      </div>

      {/* Organization Selector */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Organization
        </label>
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Choose an organization...</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.planTier})
            </option>
          ))}
        </select>
      </div>

      {selectedOrg && (
        <>
          {loading ? (
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration.type}
                  className="bg-white rounded-lg border shadow-sm p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                        {getIconComponent(integration.icon)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-gray-500">{integration.description}</p>
                      </div>
                    </div>
                  </div>

                  {integration.connected && integration.integration ? (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        {getStatusBadge(integration.integration.status)}
                        {integration.integration.lastSyncAt && (
                          <span className="text-xs text-gray-500">
                            Last sync: {new Date(integration.integration.lastSyncAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {integration.integration.errorMsg && (
                        <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">
                          {integration.integration.errorMsg}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={integration.integration.enabled}
                              onChange={(e) => toggleIntegration(integration.integration!.id, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-sm text-gray-600">
                            {integration.integration.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchIntegrations()}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                            title="Refresh"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => disconnectIntegration(integration.integration!.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Disconnect"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => connectIntegration(integration.type, integration.name)}
                        disabled={connecting === integration.type}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {connecting === integration.type ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Connect
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
