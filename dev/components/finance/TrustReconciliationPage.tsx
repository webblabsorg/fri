'use client'

import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Play,
  Settings,
} from 'lucide-react'

interface TrustAccount {
  id: string
  accountName: string
  bankName: string
  currentBalance: number
  lastReconciledDate: string | null
  jurisdiction: string
}

interface Reconciliation {
  id: string
  reconciliationDate: string
  periodStart: string
  periodEnd: string
  bankBalance: number
  trustLedgerBalance: number
  clientLedgersTotal: number
  adjustedBankBalance: number
  isBalanced: boolean
  discrepancy: number | null
  status: string
}

interface ReconciliationSchedule {
  id: string
  trustAccountId: string
  trustAccountName: string
  frequency: 'daily' | 'weekly' | 'monthly'
  timeOfDay: string
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string
}

export default function TrustReconciliationPage({ organizationId }: { organizationId: string }) {
  const [accounts, setAccounts] = useState<TrustAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [schedules, setSchedules] = useState<ReconciliationSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewReconciliation, setShowNewReconciliation] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [bankBalance, setBankBalance] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  useEffect(() => {
    fetchAccounts()
    fetchSchedules()
  }, [organizationId])

  useEffect(() => {
    if (selectedAccount) {
      fetchReconciliations()
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`/api/trust/accounts?organizationId=${organizationId}`)
      const data = await res.json()
      setAccounts(data.accounts || [])
      if (data.accounts?.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0].id)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReconciliations = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/trust/reconciliations?organizationId=${organizationId}&trustAccountId=${selectedAccount}`)
      const data = await res.json()
      setReconciliations(data.reconciliations || [])
    } catch (error) {
      console.error('Error fetching reconciliations:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/trust/reconciliation-schedules?organizationId=${organizationId}`)
      const data = await res.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  const startReconciliation = async () => {
    if (!selectedAccount || !bankBalance || !periodStart || !periodEnd) return

    try {
      const res = await fetch(`/api/trust/accounts/${selectedAccount}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          bankBalance: parseFloat(bankBalance),
          periodStart,
          periodEnd,
        }),
      })

      if (res.ok) {
        setShowNewReconciliation(false)
        setBankBalance('')
        setPeriodStart('')
        setPeriodEnd('')
        fetchReconciliations()
      }
    } catch (error) {
      console.error('Error starting reconciliation:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const selectedAccountData = accounts.find((a) => a.id === selectedAccount)

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading reconciliation data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Three-Way Reconciliation</h1>
            <p className="text-gray-400 mt-1">Bank Statement vs Trust Ledger vs Client Ledgers</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Schedules
            </button>
            <button
              onClick={() => setShowNewReconciliation(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              New Reconciliation
            </button>
          </div>
        </div>

        {/* Account Selector */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Select Trust Account</label>
          <select
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full md:w-96 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id} className="bg-black">
                {account.accountName} - {account.bankName}
              </option>
            ))}
          </select>
        </div>

        {/* Account Summary */}
        {selectedAccountData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">Current Balance</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(selectedAccountData.currentBalance)}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-gray-400 text-sm">Last Reconciled</span>
              </div>
              <p className="text-2xl font-bold">
                {selectedAccountData.lastReconciledDate
                  ? formatDate(selectedAccountData.lastReconciledDate)
                  : 'Never'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span className="text-gray-400 text-sm">Jurisdiction</span>
              </div>
              <p className="text-2xl font-bold">{selectedAccountData.jurisdiction}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">Reconciliations</span>
              </div>
              <p className="text-2xl font-bold">{reconciliations.length}</p>
            </div>
          </div>
        )}

        {/* Reconciliation History */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Reconciliation History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Period</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Bank Balance</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Trust Ledger</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Client Ledgers</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Discrepancy</th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((rec) => (
                  <tr key={rec.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">{formatDate(rec.reconciliationDate)}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {formatDate(rec.periodStart)} - {formatDate(rec.periodEnd)}
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(rec.bankBalance)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(rec.trustLedgerBalance)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(rec.clientLedgersTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      {rec.isBalanced ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Balanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded text-sm">
                          <XCircle className="w-4 h-4" />
                          Unbalanced
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rec.discrepancy !== null ? (
                        <span className="text-red-500">{formatCurrency(rec.discrepancy)}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {reconciliations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No reconciliations found. Start your first reconciliation above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Reconciliation Modal */}
        {showNewReconciliation && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Start New Reconciliation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bank Statement Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bankBalance}
                    onChange={(e) => setBankBalance(e.target.value)}
                    placeholder="Enter bank balance"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewReconciliation(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startReconciliation}
                  className="flex-1 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Start Reconciliation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedules Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Automated Reconciliation Schedules</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{schedule.trustAccountName}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} at {schedule.timeOfDay}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                          schedule.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Next: {formatDate(schedule.nextRunAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {schedules.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No automated schedules configured.
                  </p>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
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
