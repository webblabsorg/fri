'use client'

import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Printer,
  DollarSign,
} from 'lucide-react'

interface TrustAccount {
  id: string
  accountName: string
  bankName: string
  currentBalance: number
}

interface ClientLedger {
  id: string
  ledgerName: string
  balance: number
  client: { displayName: string }
  matter?: { name: string }
}

interface TrustTransaction {
  id: string
  transactionType: string
  amount: number
  runningBalance: number
  description: string
  paymentMethod?: string
  checkNumber?: string
  payee?: string
  transactionDate: string
  isReconciled: boolean
  isCleared: boolean
  voidedAt?: string
  clientLedger: {
    ledgerName: string
    client: { displayName: string }
  }
}

export default function TrustTransactionsPage({ organizationId }: { organizationId: string }) {
  const [accounts, setAccounts] = useState<TrustAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [ledgers, setLedgers] = useState<ClientLedger[]>([])
  const [transactions, setTransactions] = useState<TrustTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTransaction, setShowNewTransaction] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('')

  // New transaction form state
  const [newTxn, setNewTxn] = useState({
    clientLedgerId: '',
    transactionType: 'deposit',
    amount: '',
    description: '',
    paymentMethod: '',
    checkNumber: '',
    payee: '',
    transactionDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchAccounts()
  }, [organizationId])

  useEffect(() => {
    if (selectedAccount) {
      fetchLedgers()
      fetchTransactions()
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

  const fetchLedgers = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/trust/accounts/${selectedAccount}/ledgers?organizationId=${organizationId}`)
      const data = await res.json()
      setLedgers(data.ledgers || [])
    } catch (error) {
      console.error('Error fetching ledgers:', error)
    }
  }

  const fetchTransactions = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/trust/transactions?organizationId=${organizationId}&trustAccountId=${selectedAccount}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const createTransaction = async () => {
    if (!selectedAccount || !newTxn.clientLedgerId || !newTxn.amount) return

    try {
      const res = await fetch('/api/trust/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          trustAccountId: selectedAccount,
          clientLedgerId: newTxn.clientLedgerId,
          transactionType: newTxn.transactionType,
          amount: parseFloat(newTxn.amount),
          description: newTxn.description,
          paymentMethod: newTxn.paymentMethod || undefined,
          checkNumber: newTxn.checkNumber || undefined,
          payee: newTxn.payee || undefined,
          transactionDate: newTxn.transactionDate,
        }),
      })

      if (res.ok) {
        setShowNewTransaction(false)
        setNewTxn({
          clientLedgerId: '',
          transactionType: 'deposit',
          amount: '',
          description: '',
          paymentMethod: '',
          checkNumber: '',
          payee: '',
          transactionDate: new Date().toISOString().split('T')[0],
        })
        fetchTransactions()
        fetchAccounts()
        fetchLedgers()
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'interest':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />
      case 'transfer_to_operating':
      case 'disbursement':
      case 'refund':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />
    }
  }

  const getTransactionTypeLabel = (type: string) => {
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
    const matchesSearch =
      !searchQuery ||
      txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.clientLedger.client.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.payee?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = !filterType || txn.transactionType === filterType

    return matchesSearch && matchesFilter
  })

  const selectedAccountData = accounts.find((a) => a.id === selectedAccount)

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading transactions...</span>
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
            <h1 className="text-3xl font-bold">Trust Transactions</h1>
            <p className="text-gray-400 mt-1">Manage deposits, disbursements, and transfers</p>
          </div>
          <button
            onClick={() => setShowNewTransaction(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>

        {/* Account Selector */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Trust Account</label>
            <select
              value={selectedAccount || ''}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id} className="bg-black">
                  {account.accountName} - {formatCurrency(account.currentBalance)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm text-gray-400 mb-2">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
            >
              <option value="" className="bg-black">All Types</option>
              <option value="deposit" className="bg-black">Deposits</option>
              <option value="disbursement" className="bg-black">Disbursements</option>
              <option value="transfer_to_operating" className="bg-black">Transfers</option>
              <option value="refund" className="bg-black">Refunds</option>
              <option value="interest" className="bg-black">Interest</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Balance</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className={`border-b border-white/5 hover:bg-white/5 ${txn.voidedAt ? 'opacity-50' : ''}`}
                  >
                    <td className="py-3 px-4">{formatDate(txn.transactionDate)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(txn.transactionType)}
                        <span>{getTransactionTypeLabel(txn.transactionType)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{txn.clientLedger.client.displayName}</p>
                        <p className="text-sm text-gray-500">{txn.clientLedger.ledgerName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="max-w-xs truncate">{txn.description}</p>
                      {txn.checkNumber && (
                        <p className="text-sm text-gray-500">Check #{txn.checkNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={
                        ['deposit', 'interest'].includes(txn.transactionType)
                          ? 'text-green-500'
                          : 'text-red-500'
                      }>
                        {['deposit', 'interest'].includes(txn.transactionType) ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(txn.runningBalance)}</td>
                    <td className="py-3 px-4 text-center">
                      {txn.voidedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded text-sm">
                          <XCircle className="w-3 h-3" />
                          Voided
                        </span>
                      ) : txn.isReconciled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded text-sm">
                          <CheckCircle className="w-3 h-3" />
                          Reconciled
                        </span>
                      ) : txn.isCleared ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-sm">
                          <CheckCircle className="w-3 h-3" />
                          Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-sm">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Transaction Modal */}
        {showNewTransaction && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">New Trust Transaction</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Client Ledger</label>
                  <select
                    value={newTxn.clientLedgerId}
                    onChange={(e) => setNewTxn({ ...newTxn, clientLedgerId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="" className="bg-black">Select client ledger...</option>
                    {ledgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id} className="bg-black">
                        {ledger.client.displayName} - {ledger.ledgerName} ({formatCurrency(ledger.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Transaction Type</label>
                  <select
                    value={newTxn.transactionType}
                    onChange={(e) => setNewTxn({ ...newTxn, transactionType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="deposit" className="bg-black">Deposit</option>
                    <option value="disbursement" className="bg-black">Disbursement</option>
                    <option value="transfer_to_operating" className="bg-black">Transfer to Operating</option>
                    <option value="refund" className="bg-black">Refund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTxn.amount}
                    onChange={(e) => setNewTxn({ ...newTxn, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={newTxn.description}
                    onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })}
                    placeholder="Transaction description..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Payment Method</label>
                  <select
                    value={newTxn.paymentMethod}
                    onChange={(e) => setNewTxn({ ...newTxn, paymentMethod: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="" className="bg-black">Select payment method...</option>
                    <option value="check" className="bg-black">Check</option>
                    <option value="wire" className="bg-black">Wire Transfer</option>
                    <option value="ach" className="bg-black">ACH</option>
                    <option value="credit_card" className="bg-black">Credit Card</option>
                    <option value="cash" className="bg-black">Cash</option>
                  </select>
                </div>

                {newTxn.paymentMethod === 'check' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Check Number</label>
                    <input
                      type="text"
                      value={newTxn.checkNumber}
                      onChange={(e) => setNewTxn({ ...newTxn, checkNumber: e.target.value })}
                      placeholder="Check number..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                )}

                {['disbursement', 'refund'].includes(newTxn.transactionType) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Payee</label>
                    <input
                      type="text"
                      value={newTxn.payee}
                      onChange={(e) => setNewTxn({ ...newTxn, payee: e.target.value })}
                      placeholder="Payee name..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Transaction Date</label>
                  <input
                    type="date"
                    value={newTxn.transactionDate}
                    onChange={(e) => setNewTxn({ ...newTxn, transactionDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewTransaction(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTransaction}
                  disabled={!newTxn.clientLedgerId || !newTxn.amount}
                  className="flex-1 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Transaction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
