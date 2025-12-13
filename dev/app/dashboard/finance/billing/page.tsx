'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  Eye,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  totalAmount: number
  balanceDue: number
  currency: string
  client: {
    displayName: string
  }
  matter?: {
    name: string
  } | null
}

export default function BillingPage() {
  const { currentOrganization } = useOrganization()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    overdueCount: 0,
    draftCount: 0,
    paidThisMonth: 0,
  })

  useEffect(() => {
    if (currentOrganization?.id) {
      loadInvoices()
    }
  }, [currentOrganization?.id, statusFilter])

  const loadInvoices = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        organizationId: currentOrganization.id,
        limit: '50',
      })
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const res = await fetch(`/api/billing/invoices?${params}`)
      if (!res.ok) throw new Error('Failed to load invoices')
      const data = await res.json()
      setInvoices(data.invoices || [])

      // Calculate stats
      const allInvoices = data.invoices || []
      const outstanding = allInvoices
        .filter((i: Invoice) => ['sent', 'viewed', 'overdue'].includes(i.status))
        .reduce((sum: number, i: Invoice) => sum + Number(i.balanceDue), 0)
      const overdue = allInvoices.filter((i: Invoice) => i.status === 'overdue').length
      const drafts = allInvoices.filter((i: Invoice) => i.status === 'draft').length

      setStats({
        totalOutstanding: outstanding,
        overdueCount: overdue,
        draftCount: drafts,
        paidThisMonth: 0,
      })
    } catch (err) {
      console.error('Error loading invoices:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoices')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-400/10 text-gray-400 border-gray-400/30',
      pending_approval: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
      approved: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
      sent: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
      viewed: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
      paid: 'bg-green-400/10 text-green-400 border-green-400/30',
      overdue: 'bg-red-400/10 text-red-400 border-red-400/30',
      cancelled: 'bg-gray-400/10 text-gray-500 border-gray-500/30',
      written_off: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
    }
    return styles[status] || styles.draft
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'sent':
        return <Send className="h-4 w-4" />
      case 'viewed':
        return <Eye className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Billing & Invoicing</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Billing & Invoicing</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage invoices, track payments, and monitor accounts receivable
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadInvoices}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link
              href="/dashboard/finance/billing/new"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Outstanding</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(stats.totalOutstanding)}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-400/10">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Overdue</p>
                <p className="text-xl font-semibold text-white">{stats.overdueCount}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-400/10">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Drafts</p>
                <p className="text-xl font-semibold text-white">{stats.draftCount}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-400/10">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Paid This Month</p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(stats.paidThisMonth)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-4 mb-6">
          <Link
            href="/dashboard/finance/billing/time-entries"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <Clock className="h-4 w-4" />
            Time Entries
          </Link>
          <Link
            href="/dashboard/finance/billing/reports"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <FileText className="h-4 w-4" />
            Reports
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['', 'draft', 'sent', 'viewed', 'overdue', 'paid'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Invoices Table */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Invoice</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Matter</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Issue Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Due Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Amount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Balance</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices found</p>
                    <p className="text-sm mt-1">Create your first invoice to get started</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/finance/billing/${invoice.id}`}
                        className="text-white hover:underline font-medium"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{invoice.client.displayName}</td>
                    <td className="px-4 py-3 text-gray-400">{invoice.matter?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {formatCurrency(invoice.balanceDue, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${getStatusBadge(
                            invoice.status
                          )}`}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </div>
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
