'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Calendar,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface ComplianceAlert {
  ruleId: string
  ruleName: string
  jurisdiction: string
  passed: boolean
  severity: 'critical' | 'warning' | 'info'
  message: string
  details?: Record<string, unknown>
  checkedAt: string
}

interface ComplianceSummary {
  total: number
  critical: number
  warning: number
  info: number
}

export default function TrustCompliancePage() {
  const { currentOrganization } = useOrganization()
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [summary, setSummary] = useState<ComplianceSummary>({ total: 0, critical: 0, warning: 0, info: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    if (currentOrganization?.id) {
      runComplianceCheck()
    }
  }, [currentOrganization?.id])

  const runComplianceCheck = async () => {
    if (!currentOrganization?.id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/trust/compliance/check?organizationId=${currentOrganization.id}`)
      if (!response.ok) {
        throw new Error('Failed to run compliance check')
      }
      const data = await response.json()
      setAlerts(data.alerts || [])
      setSummary(data.summary || { total: 0, critical: 0, warning: 0, info: 0 })
      setLastChecked(new Date())
    } catch (err) {
      console.error('Error running compliance check:', err)
      setError(err instanceof Error ? err.message : 'Failed to run compliance check')
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityIcon = (severity: string, passed: boolean) => {
    if (passed) {
      return <CheckCircle className="h-5 w-5 text-green-400" />
    }
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getSeverityBadge = (severity: string, passed: boolean) => {
    if (passed) {
      return 'bg-white/10 text-green-400 border border-green-400/30'
    }
    switch (severity) {
      case 'critical':
        return 'bg-white/10 text-red-400 border border-red-400/30'
      case 'warning':
        return 'bg-white/10 text-yellow-400 border border-yellow-400/30'
      default:
        return 'bg-white/10 text-blue-400 border border-blue-400/30'
    }
  }

  const passedCount = alerts.filter(a => a.passed).length
  const failedCount = alerts.filter(a => !a.passed).length

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/dashboard/finance/trust" className="hover:text-white">Trust</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Compliance</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">IOLTA Compliance Check</h1>
            <p className="mt-1 text-sm text-gray-400">
              Verify compliance with trust accounting rules and regulations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastChecked && (
              <span className="text-sm text-gray-400">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={runComplianceCheck}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Run Check
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Rules</p>
                <p className="text-xl font-semibold text-white">{alerts.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Passed</p>
                <p className="text-xl font-semibold text-white">{passedCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Failed</p>
                <p className="text-xl font-semibold text-white">{failedCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Critical Issues</p>
                <p className="text-xl font-semibold text-white">{summary.critical}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        {/* Compliance Results */}
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Compliance Rules</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Running compliance check...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance rules configured</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {alerts.map((alert, index) => (
                <div
                  key={`${alert.ruleId}-${index}`}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity, alert.passed)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-medium">{alert.ruleName}</h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getSeverityBadge(alert.severity, alert.passed)}`}>
                          {alert.passed ? 'Passed' : alert.severity}
                        </span>
                        <span className="text-xs text-gray-500">{alert.jurisdiction}</span>
                      </div>
                      <p className="text-sm text-gray-400">{alert.message}</p>
                      {alert.details && Object.keys(alert.details).length > 0 && (
                        <div className="mt-2 p-2 rounded bg-white/5 text-xs text-gray-400">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(alert.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jurisdiction Info */}
        <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="text-white font-medium mb-2">Supported Jurisdictions</h3>
          <p className="text-sm text-gray-400 mb-3">
            Compliance rules are checked against the following jurisdictions:
          </p>
          <div className="flex flex-wrap gap-2">
            {['ABA Model Rules', 'California', 'New York', 'Texas', 'Florida', 'Illinois'].map((j) => (
              <span
                key={j}
                className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white border border-white/20"
              >
                {j}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
