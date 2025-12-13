'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

interface LedgerEntry {
  id: string
  accountId: string
  journalId: string
  debit: number
  credit: number
  description: string
  referenceId?: string
  referenceType?: string
  currency: string
  postedDate: string
  fiscalYear: number
  fiscalPeriod: number
  isReconciled: boolean
  createdBy: string
  createdAt: string
  account: {
    id: string
    accountNumber: string
    accountName: string
    accountType: string
  }
  journal: {
    id: string
    journalNumber: string
    journalType: string
    status: string
  }
}

interface GeneralLedgerPageProps {
  organizationId: string
}

export default function GeneralLedgerPage({ organizationId }: GeneralLedgerPageProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [accounts, setAccounts] = useState<Array<{ id: string; accountNumber: string; accountName: string }>>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  })

  useEffect(() => {
    fetchAccounts()
  }, [organizationId])

  useEffect(() => {
    fetchLedgerEntries()
  }, [organizationId, selectedAccount, dateRange, pagination.page])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(
        `/api/finance/accounts?organizationId=${organizationId}`
      )
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      if (selectedAccount) {
        params.append('accountId', selectedAccount)
      }

      const response = await fetch(`/api/finance/ledger?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching ledger entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.journal.journalNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Group entries by account for summary
  const accountSummaries = entries.reduce((acc, entry) => {
    const accountId = entry.accountId
    if (!acc[accountId]) {
      acc[accountId] = {
        account: entry.account,
        totalDebit: 0,
        totalCredit: 0,
        entryCount: 0,
      }
    }
    acc[accountId].totalDebit += entry.debit
    acc[accountId].totalCredit += entry.credit
    acc[accountId].entryCount++
    return acc
  }, {} as Record<string, { account: LedgerEntry['account']; totalDebit: number; totalCredit: number; entryCount: number }>)

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const exportToCSV = () => {
    const headers = ['Date', 'Journal #', 'Account', 'Description', 'Debit', 'Credit', 'Reference']
    const rows = filteredEntries.map((e) => [
      new Date(e.postedDate).toLocaleDateString(),
      e.journal.journalNumber,
      `${e.account.accountNumber} - ${e.account.accountName}`,
      e.description,
      e.debit > 0 ? e.debit.toFixed(2) : '',
      e.credit > 0 ? e.credit.toFixed(2) : '',
      e.referenceType ? `${e.referenceType}:${e.referenceId}` : '',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `general-ledger-${dateRange.startDate}-${dateRange.endDate}.csv`
    a.click()
  }

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading ledger...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">General Ledger</h1>
            <p className="text-sm text-white/60 mt-1">
              View and analyze all financial transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLedgerEntries}
              className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 min-w-[200px]"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountNumber} - {account.accountName}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/40" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
            />
            <span className="text-white/40">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Total Debits</span>
          </div>
          <div className="text-2xl font-semibold text-white">
            ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Total Credits</span>
          </div>
          <div className="text-2xl font-semibold text-white">
            ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Entries</span>
          </div>
          <div className="text-2xl font-semibold text-white">
            {filteredEntries.length}
          </div>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {isBalanced ? (
              <CheckCircle className="w-4 h-4 text-white/60" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white/60" />
            )}
            <span className="text-sm text-white/60">Balance Status</span>
          </div>
          <div className={`text-2xl font-semibold ${isBalanced ? 'text-white' : 'text-white/60'}`}>
            {isBalanced ? 'Balanced' : `Off by $${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="px-6 py-4">
        <div className="border border-white/10 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-white/5 border-b border-white/10 text-sm text-white/60">
            <div className="col-span-1">Date</div>
            <div className="col-span-1">Journal #</div>
            <div className="col-span-2">Account</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1 text-right">Debit</div>
            <div className="col-span-1 text-right">Credit</div>
            <div className="col-span-1">Reference</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Table Body */}
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No ledger entries found</p>
              <p className="text-sm mt-2">
                Adjust your filters or date range
              </p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-4 py-3 px-4 border-b border-white/10 hover:bg-white/5 transition-colors text-sm"
                >
                  <div className="col-span-1 text-white/70">
                    {new Date(entry.postedDate).toLocaleDateString()}
                  </div>
                  <div className="col-span-1">
                    <span className="font-mono text-xs text-white/60">
                      {entry.journal.journalNumber}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-white font-medium truncate">
                      {entry.account.accountName}
                    </div>
                    <div className="text-xs text-white/50">
                      {entry.account.accountNumber}
                    </div>
                  </div>
                  <div className="col-span-4 text-white/80 truncate">
                    {entry.description}
                  </div>
                  <div className="col-span-1 text-right font-mono">
                    {entry.debit > 0 ? (
                      <span className="text-white">
                        ${entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-white/30">-</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right font-mono">
                    {entry.credit > 0 ? (
                      <span className="text-white">
                        ${entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-white/30">-</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    {entry.referenceType && (
                      <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/60">
                        {entry.referenceType}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1">
                    {entry.isReconciled ? (
                      <span className="flex items-center gap-1 text-xs text-white/60">
                        <CheckCircle className="w-3 h-3" />
                        Reconciled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table Footer - Totals */}
          <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-white/5 border-t border-white/10 text-sm font-semibold">
            <div className="col-span-8 text-white/60">Totals</div>
            <div className="col-span-1 text-right font-mono text-white">
              ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="col-span-1 text-right font-mono text-white">
              ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="col-span-2"></div>
          </div>
        </div>
      </div>

      {/* Account Summary Section */}
      {Object.keys(accountSummaries).length > 0 && (
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-white mb-4">Account Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(accountSummaries)
              .sort((a, b) => a.account.accountNumber.localeCompare(b.account.accountNumber))
              .slice(0, 9)
              .map((summary) => (
                <div
                  key={summary.account.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-white/60">
                      {summary.account.accountNumber}
                    </span>
                    <span className="text-xs text-white/40">
                      {summary.entryCount} entries
                    </span>
                  </div>
                  <div className="text-white font-medium truncate mb-3">
                    {summary.account.accountName}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-white/50 text-xs">Debits</div>
                      <div className="font-mono text-white">
                        ${summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/50 text-xs">Credits</div>
                      <div className="font-mono text-white">
                        ${summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-white/50 text-xs">Net</div>
                    <div className={`font-mono ${summary.totalDebit - summary.totalCredit >= 0 ? 'text-white' : 'text-white/70'}`}>
                      ${Math.abs(summary.totalDebit - summary.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {summary.totalDebit - summary.totalCredit >= 0 ? ' DR' : ' CR'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
