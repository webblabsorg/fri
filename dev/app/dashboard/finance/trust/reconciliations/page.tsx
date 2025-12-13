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
} from 'lucide-react'

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
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadReconciliations()
  }, [filter])

  const loadReconciliations = async () => {
    setIsLoading(true)
    try {
      setReconciliations([
        {
          id: '1',
          trustAccountName: 'IOLTA Trust Account',
          reconciliationDate: '2024-01-31',
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          bankBalance: 125000.00,
          trustLedgerBalance: 125000.00,
          isBalanced: true,
          status: 'approved',
          reconciledBy: 'John Smith',
        },
        {
          id: '2',
          trustAccountName: 'IOLTA Trust Account',
          reconciliationDate: '2023-12-31',
          periodStart: '2023-12-01',
          periodEnd: '2023-12-31',
          bankBalance: 118500.00,
          trustLedgerBalance: 118500.00,
          isBalanced: true,
          status: 'approved',
          reconciledBy: 'John Smith',
        },
        {
          id: '3',
          trustAccountName: 'Client Escrow Account',
          reconciliationDate: '2024-01-31',
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          bankBalance: 45000.00,
          trustLedgerBalance: 44850.00,
          isBalanced: false,
          status: 'pending',
          reconciledBy: 'Jane Doe',
        },
      ])
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
      return 'bg-red-100 text-red-800'
    }
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Trust Reconciliations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Three-way reconciliation for trust accounts
            </p>
          </div>
          <Link
            href="/dashboard/finance/trust/reconciliations/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Reconciliation
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Scale className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-semibold text-foreground">{reconciliations.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balanced</p>
                <p className="text-xl font-semibold text-foreground">
                  {reconciliations.filter((r) => r.isBalanced).length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unbalanced</p>
                <p className="text-xl font-semibold text-foreground">
                  {reconciliations.filter((r) => !r.isBalanced).length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold text-foreground">
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
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
          >
            <option value="all">All Reconciliations</option>
            <option value="balanced">Balanced Only</option>
            <option value="unbalanced">Unbalanced Only</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Trust Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Bank Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ledger Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Reconciled By
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Loading reconciliations...
                  </td>
                </tr>
              ) : filteredReconciliations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No reconciliations found
                  </td>
                </tr>
              ) : (
                filteredReconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Scale className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{rec.trustAccountName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(rec.periodStart).toLocaleDateString()} -{' '}
                        {new Date(rec.periodEnd).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-foreground">
                      ${rec.bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-foreground">
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {rec.reconciledBy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/finance/trust/reconciliations/${rec.id}`}
                        className="text-muted-foreground hover:text-foreground"
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
