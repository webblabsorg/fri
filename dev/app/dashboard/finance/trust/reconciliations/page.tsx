'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Scale,
  Plus,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface Reconciliation {
  id: string
  trustAccountName: string
  reconciliationDate: string
  periodStart: string
  periodEnd: string
  bankBalance: number
  trustLedgerBalance: number
  isBalanced: boolean
  status: string
  reconciledBy: string
}

export default function ReconciliationsPage() {
  const { currentOrganization } = useOrganization()
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (currentOrganization?.id) {
      loadReconciliations()
    }
  }, [currentOrganization?.id, filter])

  const loadReconciliations = async () => {
    if (!currentOrganization?.id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ organizationId: currentOrganization.id })
      if (filter !== 'all') {
        params.append('status', filter)
      }
      const response = await fetch(`/api/trust/reconciliations?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load reconciliations')
      }
      const data = await response.json()
      setReconciliations(data.reconciliations || [])
    } catch (err) {
      console.error('Error loading reconciliations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reconciliations')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string, isBalanced: boolean) => {
    if (!isBalanced) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string, isBalanced: boolean) => {
    if (!isBalanced) {
      return 'bg-white/10 text-red-400 border border-red-400/30'
    }
    const styles: Record<string, string> = {
      draft: 'bg-white/10 text-gray-400 border border-white/20',
      pending: 'bg-white/10 text-yellow-400 border border-yellow-400/30',
      approved: 'bg-white/10 text-green-400 border border-green-400/30',
    }
    return styles[status] || styles.draft
  }

  const filteredReconciliations = reconciliations.filter((rec) => {
    if (filter === 'balanced' && !rec.isBalanced) return false
    if (filter === 'unbalanced' && rec.isBalanced) return false
    if (filter === 'approved' && rec.status !== 'approved') return false
    if (filter === 'pending' && rec.status !== 'pending') return false
    return true
  })

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
              <span className="text-white">Reconciliations</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Trust Reconciliations</h1>
            <p className="mt-1 text-sm text-gray-400">
              Three-way reconciliation for trust accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadReconciliations}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dashboard/finance/trust/reconciliations/new"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Reconciliation
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-xl font-semibold text-white">{reconciliations.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Balanced</p>
                <p className="text-xl font-semibold text-white">
                  {reconciliations.filter((r) => r.isBalanced).length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Unbalanced</p>
                <p className="text-xl font-semibold text-white">
                  {reconciliations.filter((r) => !r.isBalanced).length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-xl font-semibold text-white">
                  {reconciliations.filter((r) => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Reconciliations</option>
            <option value="balanced">Balanced Only</option>
            <option value="unbalanced">Unbalanced Only</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Trust Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Bank Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Ledger Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Reconciled By
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-black">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading reconciliations...
                  </td>
                </tr>
              ) : filteredReconciliations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No reconciliations found
                  </td>
                </tr>
              ) : (
                filteredReconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Scale className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-white">{rec.trustAccountName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {new Date(rec.periodStart).toLocaleDateString()} -{' '}
                        {new Date(rec.periodEnd).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-white">
                      ${rec.bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-white">
                      ${rec.trustLedgerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(rec.status, rec.isBalanced)}`}
                      >
                        {getStatusIcon(rec.status, rec.isBalanced)}
                        {rec.isBalanced ? rec.status : 'Discrepancy'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                      {rec.reconciledBy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/finance/trust/reconciliations/${rec.id}`}
                        className="text-gray-400 hover:text-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
