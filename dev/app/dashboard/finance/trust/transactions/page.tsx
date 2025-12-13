'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface TrustAccount {
  id: string
  accountName: string
}

interface ClientLedger {
  id: string
  ledgerName: string
  clientName: string
}

interface TrustTransaction {
  id: string
  transactionType: string
  amount: number
  description: string
  transactionDate: string
  clientLedger?: {
    ledgerName: string
    client: { displayName: string }
  }
  checkNumber?: string
  referenceNumber?: string
  isReconciled: boolean
  isCleared: boolean
}

export default function TrustTransactionsPage() {
  const { currentOrganization } = useOrganization()
  const [accounts, setAccounts] = useState<TrustAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [ledgers, setLedgers] = useState<ClientLedger[]>([])
  const [selectedLedger, setSelectedLedger] = useState<string>('')
  const [transactions, setTransactions] = useState<TrustTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadAccounts()
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    if (selectedAccount) {
      loadLedgers()
      loadTransactions()
    }
  }, [selectedAccount])

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions()
    }
  }, [selectedLedger, typeFilter])

  const loadAccounts = async () => {
    if (!currentOrganization?.id) return
    try {
      const response = await fetch(`/api/trust/accounts?organizationId=${currentOrganization.id}`)
      if (!response.ok) throw new Error('Failed to load accounts')
      const data = await response.json()
      setAccounts(data.accounts || [])
      if (data.accounts?.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0].id)
      }
    } catch (err) {
      console.error('Error loading accounts:', err)
    }
  }

  const loadLedgers = async () => {
    if (!selectedAccount) return
    try {
      const response = await fetch(`/api/trust/accounts/${selectedAccount}/ledgers`)
      if (!response.ok) throw new Error('Failed to load ledgers')
      const data = await response.json()
      setLedgers(data.ledgers || [])
    } catch (err) {
      console.error('Error loading ledgers:', err)
    }
  }

  const loadTransactions = async () => {
    if (!selectedAccount || !currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        organizationId: currentOrganization.id,
        trustAccountId: selectedAccount,
      })
      if (selectedLedger) {
        params.append('clientLedgerId', selectedLedger)
      }
      if (typeFilter !== 'all') {
        params.append('transactionType', typeFilter)
      }
      const response = await fetch(`/api/trust/transactions?${params}`)
      if (!response.ok) throw new Error('Failed to load transactions')
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getTransactionIcon = (type: string) => {
    if (['deposit', 'interest'].includes(type)) {
      return <ArrowDownLeft className="h-4 w-4 text-green-400" />
    }
    return <ArrowUpRight className="h-4 w-4 text-red-400" />
  }

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Deposit',
      transfer_to_operating: 'Transfer to Operating',
      disbursement: 'Disbursement',
      refund: 'Refund',
      interest: 'Interest',
    }
    return labels[type] || type
  }

  const filteredTransactions = transactions.filter((txn) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      txn.description.toLowerCase().includes(query) ||
      txn.clientLedger?.client.displayName.toLowerCase().includes(query) ||
      txn.checkNumber?.toLowerCase().includes(query) ||
      txn.referenceNumber?.toLowerCase().includes(query)
    )
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
              <span className="text-white">Transactions</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Trust Transactions</h1>
            <p className="mt-1 text-sm text-gray-400">
              View and manage trust account transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTransactions}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Transaction
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="">Select Account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountName}
              </option>
            ))}
          </select>

          <select
            value={selectedLedger}
            onChange={(e) => setSelectedLedger(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="">All Client Ledgers</option>
            {ledgers.map((ledger) => (
              <option key={ledger.id} value={ledger.id}>
                {ledger.ledgerName} - {ledger.clientName}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="disbursement">Disbursements</option>
            <option value="transfer_to_operating">Transfers</option>
            <option value="refund">Refunds</option>
            <option value="interest">Interest</option>
          </select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:border-white focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        {/* Transactions Table */}
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Client / Ledger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-black">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {new Date(txn.transactionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(txn.transactionType)}
                        <span className="text-sm text-white">
                          {getTransactionLabel(txn.transactionType)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm">
                        <p className="text-white">{txn.clientLedger?.client.displayName || '-'}</p>
                        <p className="text-gray-400">{txn.clientLedger?.ledgerName || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white truncate max-w-xs">{txn.description}</p>
                      {txn.checkNumber && (
                        <p className="text-xs text-gray-400">Check #{txn.checkNumber}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${
                        ['deposit', 'interest'].includes(txn.transactionType)
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {['deposit', 'interest'].includes(txn.transactionType) ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {txn.isReconciled && (
                          <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs text-green-400 border border-green-400/30">
                            Reconciled
                          </span>
                        )}
                        {txn.isCleared && (
                          <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs text-blue-400 border border-blue-400/30">
                            Cleared
                          </span>
                        )}
                        {!txn.isReconciled && !txn.isCleared && (
                          <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs text-gray-400 border border-white/20">
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/finance/trust/transactions/${txn.id}`}
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

      {/* New Transaction Modal - placeholder for now */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-white/20 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">New Transaction</h2>
            <p className="text-gray-400 mb-4">Transaction creation form coming soon.</p>
            <button
              onClick={() => setShowNewModal(false)}
              className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
