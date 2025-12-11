'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, Clock, AlertTriangle, FileText, Filter } from 'lucide-react'

interface IPWhitelistEntry {
  id: string
  ipAddress: string
  description: string | null
  enabled: boolean
  createdAt: string
}

interface RetentionPolicy {
  id: string
  toolRunsRetention: number
  auditLogsRetention: number
  documentsRetention: number
  autoDelete: boolean
  lastCleanupAt: string | null
}

interface AuditLog {
  id: string
  userId: string | null
  eventType: string
  eventCategory: string
  resourceType: string | null
  resourceId: string | null
  action: string
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  riskLevel: string
  createdAt: string
}

interface Organization {
  id: string
  name: string
  planTier: string
}

export default function SecuritySettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'whitelist' | 'retention' | 'audit'>('whitelist')
  const [loading, setLoading] = useState(false)

  // IP Whitelist
  const [whitelist, setWhitelist] = useState<IPWhitelistEntry[]>([])
  const [showAddIP, setShowAddIP] = useState(false)
  const [newIP, setNewIP] = useState({ ipAddress: '', description: '' })

  // Retention Policy
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy | null>(null)
  const [retentionForm, setRetentionForm] = useState({
    toolRunsRetention: 365,
    auditLogsRetention: 730,
    documentsRetention: 365,
    autoDelete: false,
  })

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditPagination, setAuditPagination] = useState({ page: 1, total: 0, pages: 0 })
  const [auditFilters, setAuditFilters] = useState({
    eventType: '',
    riskLevel: '',
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchSecurityData()
    }
  }, [selectedOrg, activeTab])

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

  async function fetchSecurityData() {
    setLoading(true)
    try {
      if (activeTab === 'whitelist') {
        const response = await fetch(`/api/enterprise/security?organizationId=${selectedOrg}&type=ip_whitelist`)
        const data = await response.json()
        setWhitelist(data.whitelist || [])
      } else if (activeTab === 'retention') {
        const response = await fetch(`/api/enterprise/security?organizationId=${selectedOrg}&type=retention_policy`)
        const data = await response.json()
        setRetentionPolicy(data.policy || null)
        if (data.policy) {
          setRetentionForm({
            toolRunsRetention: data.policy.toolRunsRetention,
            auditLogsRetention: data.policy.auditLogsRetention,
            documentsRetention: data.policy.documentsRetention,
            autoDelete: data.policy.autoDelete,
          })
        }
      } else if (activeTab === 'audit') {
        const params = new URLSearchParams({
          organizationId: selectedOrg,
          type: 'audit_logs',
          page: auditPagination.page.toString(),
        })
        const response = await fetch(`/api/enterprise/security?${params}`)
        const data = await response.json()
        setAuditLogs(data.logs || [])
        setAuditPagination(data.pagination || { page: 1, total: 0, pages: 0 })
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addIPToWhitelist() {
    try {
      const response = await fetch('/api/enterprise/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          type: 'ip_whitelist',
          ...newIP,
        }),
      })

      if (response.ok) {
        setShowAddIP(false)
        setNewIP({ ipAddress: '', description: '' })
        fetchSecurityData()
      }
    } catch (error) {
      console.error('Error adding IP:', error)
    }
  }

  async function removeIPFromWhitelist(id: string) {
    if (!confirm('Are you sure you want to remove this IP from the whitelist?')) return

    try {
      await fetch(`/api/enterprise/security?id=${id}&organizationId=${selectedOrg}`, {
        method: 'DELETE',
      })
      fetchSecurityData()
    } catch (error) {
      console.error('Error removing IP:', error)
    }
  }

  async function saveRetentionPolicy() {
    try {
      const response = await fetch('/api/enterprise/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          type: 'retention_policy',
          ...retentionForm,
        }),
      })

      if (response.ok) {
        fetchSecurityData()
      }
    } catch (error) {
      console.error('Error saving retention policy:', error)
    }
  }

  function getRiskLevelBadge(level: string) {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const selectedOrgData = organizations.find(o => o.id === selectedOrg)
  const isEnterprise = selectedOrgData?.planTier === 'enterprise'

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Security Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage IP whitelisting, data retention, and audit logs
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

      {selectedOrg && !isEnterprise && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">Enterprise Plan Required</p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Advanced security features are only available for organizations on the Enterprise plan.
          </p>
        </div>
      )}

      {selectedOrg && isEnterprise && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('whitelist')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'whitelist' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              IP Whitelist
            </button>
            <button
              onClick={() => setActiveTab('retention')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'retention' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Data Retention
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'audit' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Audit Logs
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <>
              {/* IP Whitelist Tab */}
              {activeTab === 'whitelist' && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">IP Whitelist</h2>
                    <button
                      onClick={() => setShowAddIP(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add IP
                    </button>
                  </div>

                  {whitelist.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No IP addresses whitelisted. All IPs are currently allowed.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {whitelist.map((entry) => (
                        <div key={entry.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-mono font-medium">{entry.ipAddress}</p>
                            {entry.description && (
                              <p className="text-sm text-gray-500">{entry.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${entry.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {entry.enabled ? 'Active' : 'Disabled'}
                            </span>
                            <button
                              onClick={() => removeIPFromWhitelist(entry.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Data Retention Tab */}
              {activeTab === 'retention' && (
                <div className="bg-white rounded-lg border shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Data Retention Policy
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tool Runs Retention (days)
                      </label>
                      <input
                        type="number"
                        value={retentionForm.toolRunsRetention}
                        onChange={(e) => setRetentionForm({ ...retentionForm, toolRunsRetention: parseInt(e.target.value) })}
                        className="w-full border rounded-lg px-3 py-2"
                        min={30}
                        max={3650}
                      />
                      <p className="text-sm text-gray-500 mt-1">How long to keep tool run history</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Audit Logs Retention (days)
                      </label>
                      <input
                        type="number"
                        value={retentionForm.auditLogsRetention}
                        onChange={(e) => setRetentionForm({ ...retentionForm, auditLogsRetention: parseInt(e.target.value) })}
                        className="w-full border rounded-lg px-3 py-2"
                        min={90}
                        max={3650}
                      />
                      <p className="text-sm text-gray-500 mt-1">How long to keep audit logs (minimum 90 days for compliance)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Documents Retention (days)
                      </label>
                      <input
                        type="number"
                        value={retentionForm.documentsRetention}
                        onChange={(e) => setRetentionForm({ ...retentionForm, documentsRetention: parseInt(e.target.value) })}
                        className="w-full border rounded-lg px-3 py-2"
                        min={30}
                        max={3650}
                      />
                      <p className="text-sm text-gray-500 mt-1">How long to keep uploaded documents</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Auto-delete expired data</p>
                        <p className="text-sm text-gray-500">Automatically delete data older than retention period</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={retentionForm.autoDelete}
                          onChange={(e) => setRetentionForm({ ...retentionForm, autoDelete: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {retentionPolicy?.lastCleanupAt && (
                      <p className="text-sm text-gray-500">
                        Last cleanup: {new Date(retentionPolicy.lastCleanupAt).toLocaleString()}
                      </p>
                    )}

                    <button
                      onClick={saveRetentionPolicy}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Policy
                    </button>
                  </div>
                </div>
              )}

              {/* Audit Logs Tab */}
              {activeTab === 'audit' && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Audit Logs
                    </h2>
                    <div className="flex gap-2">
                      <select
                        value={auditFilters.riskLevel}
                        onChange={(e) => setAuditFilters({ ...auditFilters, riskLevel: e.target.value })}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="">All Risk Levels</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No audit logs found.</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{log.eventType}</span>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${getRiskLevelBadge(log.riskLevel)}`}>
                                    {log.riskLevel}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {log.action} on {log.resourceType || 'system'}
                                  {log.resourceId && ` (${log.resourceId.substring(0, 8)}...)`}
                                </p>
                                {log.ipAddress && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    IP: {log.ipAddress}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {auditPagination.pages > 1 && (
                        <div className="p-4 border-t flex justify-center gap-2">
                          <button
                            onClick={() => setAuditPagination({ ...auditPagination, page: auditPagination.page - 1 })}
                            disabled={auditPagination.page === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1">
                            Page {auditPagination.page} of {auditPagination.pages}
                          </span>
                          <button
                            onClick={() => setAuditPagination({ ...auditPagination, page: auditPagination.page + 1 })}
                            disabled={auditPagination.page === auditPagination.pages}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add IP Modal */}
      {showAddIP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add IP to Whitelist</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address or CIDR</label>
                <input
                  type="text"
                  value={newIP.ipAddress}
                  onChange={(e) => setNewIP({ ...newIP, ipAddress: e.target.value })}
                  placeholder="192.168.1.0/24 or 10.0.0.1"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newIP.description}
                  onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
                  placeholder="Office network"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddIP(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addIPToWhitelist}
                disabled={!newIP.ipAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add IP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
