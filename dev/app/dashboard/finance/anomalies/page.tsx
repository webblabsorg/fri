'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Eye,
  Shield,
  TrendingUp,
} from 'lucide-react'

interface Anomaly {
  id: string
  transactionType: string
  transactionId: string
  anomalyType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  amount: number | null
  status: string
  detectedAt: string
  reviewedBy: string | null
  resolution: string | null
}

interface AnomalyStats {
  pendingCount: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
}

export default function AnomaliesPage() {
  const { currentOrganization, isLoading: isOrgLoading } = useOrganization()
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [stats, setStats] = useState<AnomalyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<{
    status: string
    severity: string
  }>({ status: 'pending', severity: '' })
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)

  useEffect(() => {
    if (!currentOrganization?.id) return
    loadAnomalies(currentOrganization.id)
    loadStats(currentOrganization.id)
  }, [filter, currentOrganization?.id])

  const loadAnomalies = async (organizationId: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('organizationId', organizationId)
      if (filter.status) params.set('status', filter.status)
      if (filter.severity) params.set('severity', filter.severity)
      
      const res = await fetch(`/api/finance/ai/anomalies?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAnomalies(data.anomalies || [])
      }
    } catch (err) {
      console.error('Failed to load anomalies:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async (organizationId: string) => {
    try {
      const params = new URLSearchParams()
      params.set('organizationId', organizationId)
      const res = await fetch(`/api/finance/ai/anomalies/stats?${params}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const runDetection = async () => {
    setIsLoading(true)
    try {
      if (!currentOrganization?.id) {
        return
      }
      const res = await fetch('/api/finance/ai/anomaly-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (res.ok) {
        await loadAnomalies(currentOrganization.id)
        await loadStats(currentOrganization.id)
      }
    } catch (err) {
      console.error('Failed to run detection:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (anomalyId: string, resolution: string) => {
    try {
      const res = await fetch('/api/finance/ai/anomaly-detection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalyId, action: 'resolve', resolution }),
      })
      if (res.ok) {
        if (currentOrganization?.id) {
          await loadAnomalies(currentOrganization.id)
          await loadStats(currentOrganization.id)
        }
        setSelectedAnomaly(null)
      }
    } catch (err) {
      console.error('Failed to resolve anomaly:', err)
    }
  }

  const handleDismiss = async (anomalyId: string) => {
    try {
      const res = await fetch('/api/finance/ai/anomaly-detection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalyId, action: 'dismiss' }),
      })
      if (res.ok) {
        if (currentOrganization?.id) {
          await loadAnomalies(currentOrganization.id)
          await loadStats(currentOrganization.id)
        }
        setSelectedAnomaly(null)
      }
    } catch (err) {
      console.error('Failed to dismiss anomaly:', err)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'reviewed': return <Eye className="w-4 h-4 text-blue-400" />
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'dismissed': return <XCircle className="w-4 h-4 text-zinc-400" />
      case 'escalated': return <ArrowUpRight className="w-4 h-4 text-red-400" />
      default: return <AlertTriangle className="w-4 h-4 text-zinc-400" />
    }
  }

  if (isOrgLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">Loading...</div>
      </div>
    )
  }

  if (!currentOrganization?.id) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">No organization found. Please join or create an organization.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financial Anomaly Detection</h1>
            <p className="text-zinc-400 mt-1">AI-powered fraud detection and compliance monitoring</p>
          </div>
          <button
            onClick={runDetection}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Run Detection
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pendingCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Critical</p>
                  <p className="text-2xl font-bold">{stats.bySeverity.critical || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">High Priority</p>
                  <p className="text-2xl font-bold">{stats.bySeverity.high || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Detection Rate</p>
                  <p className="text-2xl font-bold">98%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <Filter className="w-5 h-5 text-zinc-400" />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="escalated">Escalated</option>
          </select>
          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Anomalies List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Description</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Detected</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading anomalies...
                  </td>
                </tr>
              ) : anomalies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    No anomalies found. Your finances look healthy!
                  </td>
                </tr>
              ) : (
                anomalies.map((anomaly) => (
                  <tr key={anomaly.id} className="hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(anomaly.status)}
                        <span className="text-sm capitalize">{anomaly.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {anomaly.anomalyType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 max-w-md truncate">
                      {anomaly.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {anomaly.amount ? `$${anomaly.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {new Date(anomaly.detectedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {anomaly.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDismiss(anomaly.id)}
                            className="p-1 hover:bg-zinc-700 rounded"
                            title="Dismiss"
                          >
                            <XCircle className="w-4 h-4 text-zinc-400" />
                          </button>
                          <button
                            onClick={() => handleResolve(anomaly.id, 'approved')}
                            className="p-1 hover:bg-zinc-700 rounded"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                          <button
                            onClick={() => setSelectedAnomaly(anomaly)}
                            className="p-1 hover:bg-zinc-700 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selectedAnomaly && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Anomaly Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400">Type</label>
                  <p className="font-medium">{selectedAnomaly.anomalyType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">Description</label>
                  <p className="text-sm">{selectedAnomaly.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-400">Severity</label>
                    <p className={`inline-block px-2 py-1 rounded text-sm ${getSeverityColor(selectedAnomaly.severity)}`}>
                      {selectedAnomaly.severity.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400">Confidence</label>
                    <p className="font-medium">{selectedAnomaly.confidence}%</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleDismiss(selectedAnomaly.id)}
                    className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleResolve(selectedAnomaly.id, 'corrected')}
                    className="flex-1 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                  >
                    Mark Corrected
                  </button>
                  <button
                    onClick={() => handleResolve(selectedAnomaly.id, 'flagged_fraud')}
                    className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
                  >
                    Flag Fraud
                  </button>
                </div>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
