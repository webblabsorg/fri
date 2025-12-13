'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  FileText,
  Plus,
  ChevronRight,
  Search,
  Filter,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Loader2,
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  matterName: string | null
  totalAmount: number
  balanceDue: number
  status: string
  issueDate: string
  dueDate: string
  currency: string
}

export default function InvoicesPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId') || ''
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (organizationId) {
      loadInvoices()
    }
  }, [filter, organizationId])

  const loadInvoices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ organizationId })
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      const response = await fetch(`/api/billing/invoices?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load invoices')
      }
      
      const data = await response.json()
      setInvoices(
        (data.invoices || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client?.displayName || 'Unknown Client',
          matterName: inv.matter?.matterName || null,
          totalAmount: Number(inv.totalAmount),
          balanceDue: Number(inv.balanceDue),
          status: inv.status,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          currency: inv.currency || 'USD',
        }))
      )
    } catch (err) {
      console.error('Error loading invoices:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoices')
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <FileText className="h-3 w-3" /> },
      sent: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Send className="h-3 w-3" /> },
      viewed: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: <Clock className="h-3 w-3" /> },
      paid: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
      overdue: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <AlertCircle className="h-3 w-3" /> },
    }
    const style = styles[status] || styles.draft
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (filter !== 'all' && inv.status !== filter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.clientName.toLowerCase().includes(query) ||
        (inv.matterName && inv.matterName.toLowerCase().includes(query))
      )
    }
    return true
  })

  const stats = {
    total: invoices.length,
    outstanding: invoices.filter(i => i.balanceDue > 0).reduce((sum, i) => sum + i.balanceDue, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.balanceDue, 0),
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/dashboard/finance" className="hover:text-white">Finance</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Invoices</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Invoices</h1>
          </div>
          <Link
            href={`/dashboard/finance/billing/new${organizationId ? `?organizationId=${organizationId}` : ''}`}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 text-sm">Total Invoices</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 text-sm">Outstanding Balance</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.outstanding)}</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 text-sm">Overdue Amount</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(stats.overdue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">Invoice</th>
                <th className="text-left p-4 text-gray-400 font-medium">Client / Matter</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-right p-4 text-gray-400 font-medium">Amount</th>
                <th className="text-right p-4 text-gray-400 font-medium">Balance Due</th>
                <th className="text-left p-4 text-gray-400 font-medium">Due Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-gray-400 text-sm">{invoice.issueDate}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{invoice.clientName}</p>
                    {invoice.matterName && (
                      <p className="text-gray-400 text-sm">{invoice.matterName}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="p-4 text-right text-white">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={invoice.balanceDue > 0 ? 'text-yellow-400' : 'text-green-400'}>
                      {formatCurrency(invoice.balanceDue)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">
                    {invoice.dueDate}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/dashboard/finance/billing/${invoice.id}${organizationId ? `?organizationId=${organizationId}` : ''}`}
                      className="text-white/60 hover:text-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isLoading && (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading invoices...
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No invoices found. <Link href={`/dashboard/finance/billing/new${organizationId ? `?organizationId=${organizationId}` : ''}`} className="text-white hover:underline">Create your first invoice</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
