'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  RefreshCw,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface AgingBucket {
  invoices: Array<{
    id: string
    invoiceNumber: string
    balanceDue: number
    dueDate: string
    client: { displayName: string }
  }>
  total: number
}

interface ARAgingReport {
  current: AgingBucket
  days1to30: AgingBucket
  days31to60: AgingBucket
  days61to90: AgingBucket
  over90: AgingBucket
  grandTotal: number
}

interface WIPReport {
  totalUnbilledTime: number
  totalUnbilledExpenses: number
  totalWIP: number
  timeEntryCount: number
  expenseCount: number
  byMatter: Array<{
    matterId: string
    matterName: string
    clientName: string
    timeAmount: number
    expenseAmount: number
    total: number
  }>
}

interface RevenueForecast {
  historicalAverage: number
  outstandingAR: number
  expectedCollections: number
  unbilledWIP: number
  forecast: Array<{
    month: string
    projectedRevenue: number
    expectedCollections: number
    potentialBillings: number
    total: number
  }>
}

export default function BillingReportsPage() {
  const { currentOrganization } = useOrganization()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<'aging' | 'wip' | 'forecast'>('aging')

  const [arAging, setArAging] = useState<ARAgingReport | null>(null)
  const [wipReport, setWipReport] = useState<WIPReport | null>(null)
  const [forecast, setForecast] = useState<RevenueForecast | null>(null)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadReports()
    }
  }, [currentOrganization?.id])

  const loadReports = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const [agingRes, wipRes, forecastRes] = await Promise.all([
        fetch(`/api/billing/reports/ar-aging?organizationId=${currentOrganization.id}`),
        fetch(`/api/billing/reports/wip?organizationId=${currentOrganization.id}`),
        fetch(`/api/billing/ai/revenue-forecast?organizationId=${currentOrganization.id}`),
      ])

      if (agingRes.ok) {
        const data = await agingRes.json()
        setArAging(data)
      }
      if (wipRes.ok) {
        const data = await wipRes.json()
        setWipReport(data)
      }
      if (forecastRes.ok) {
        const data = await forecastRes.json()
        setForecast(data)
      }
    } catch (err) {
      console.error('Error loading reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reports')
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
              <Link href="/dashboard/finance/billing" className="hover:text-white">Billing</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Reports</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Billing Reports</h1>
            <p className="mt-1 text-sm text-gray-400">
              AR aging, work in progress, and revenue forecasting
            </p>
          </div>
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {error}
          </div>
        )}

        {/* Report Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveReport('aging')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeReport === 'aging'
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            AR Aging
          </button>
          <button
            onClick={() => setActiveReport('wip')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeReport === 'wip'
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            Work in Progress
          </button>
          <button
            onClick={() => setActiveReport('forecast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeReport === 'forecast'
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Revenue Forecast
          </button>
        </div>

        {/* AR Aging Report */}
        {activeReport === 'aging' && arAging && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-6 gap-4">
              <div className="p-4 rounded-lg border border-green-400/30 bg-green-400/5">
                <p className="text-sm text-green-400">Current</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(arAging.current.total)}</p>
                <p className="text-xs text-gray-400">{arAging.current.invoices.length} invoices</p>
              </div>
              <div className="p-4 rounded-lg border border-yellow-400/30 bg-yellow-400/5">
                <p className="text-sm text-yellow-400">1-30 Days</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(arAging.days1to30.total)}</p>
                <p className="text-xs text-gray-400">{arAging.days1to30.invoices.length} invoices</p>
              </div>
              <div className="p-4 rounded-lg border border-orange-400/30 bg-orange-400/5">
                <p className="text-sm text-orange-400">31-60 Days</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(arAging.days31to60.total)}</p>
                <p className="text-xs text-gray-400">{arAging.days31to60.invoices.length} invoices</p>
              </div>
              <div className="p-4 rounded-lg border border-red-400/30 bg-red-400/5">
                <p className="text-sm text-red-400">61-90 Days</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(arAging.days61to90.total)}</p>
                <p className="text-xs text-gray-400">{arAging.days61to90.invoices.length} invoices</p>
              </div>
              <div className="p-4 rounded-lg border border-red-600/30 bg-red-600/5">
                <p className="text-sm text-red-500">90+ Days</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(arAging.over90.total)}</p>
                <p className="text-xs text-gray-400">{arAging.over90.invoices.length} invoices</p>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-gray-400">Total AR</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(arAging.grandTotal)}</p>
              </div>
            </div>

            {/* Aging Detail Table */}
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-medium">Outstanding Invoices</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Invoice</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Due Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Balance</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Aging</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { bucket: arAging.current, label: 'Current', color: 'text-green-400' },
                    { bucket: arAging.days1to30, label: '1-30', color: 'text-yellow-400' },
                    { bucket: arAging.days31to60, label: '31-60', color: 'text-orange-400' },
                    { bucket: arAging.days61to90, label: '61-90', color: 'text-red-400' },
                    { bucket: arAging.over90, label: '90+', color: 'text-red-500' },
                  ].flatMap(({ bucket, label, color }) =>
                    bucket.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/finance/billing/${inv.id}`}
                            className="text-white hover:underline"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{inv.client.displayName}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right text-white">{formatCurrency(inv.balanceDue)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${color}`}>{label}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WIP Report */}
        {activeReport === 'wip' && wipReport && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total WIP</p>
                    <p className="text-xl font-semibold text-white">{formatCurrency(wipReport.totalWIP)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-400/10">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Unbilled Time</p>
                    <p className="text-xl font-semibold text-white">{formatCurrency(wipReport.totalUnbilledTime)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-400/10">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Unbilled Expenses</p>
                    <p className="text-xl font-semibold text-white">{formatCurrency(wipReport.totalUnbilledExpenses)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-400/10">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Entries</p>
                    <p className="text-xl font-semibold text-white">
                      {wipReport.timeEntryCount + wipReport.expenseCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* WIP by Matter */}
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-medium">WIP by Matter</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Matter</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Client</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Time</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Expenses</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {wipReport.byMatter.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No unbilled work in progress
                      </td>
                    </tr>
                  ) : (
                    wipReport.byMatter.map((matter) => (
                      <tr key={matter.matterId} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{matter.matterName}</td>
                        <td className="px-4 py-3 text-gray-300">{matter.clientName}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(matter.timeAmount)}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(matter.expenseAmount)}</td>
                        <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(matter.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Forecast */}
        {activeReport === 'forecast' && forecast && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-gray-400">Historical Monthly Avg</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(forecast.historicalAverage)}</p>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-gray-400">Outstanding AR</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(forecast.outstandingAR)}</p>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-gray-400">Expected Collections</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(forecast.expectedCollections)}</p>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-gray-400">Unbilled WIP</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(forecast.unbilledWIP)}</p>
              </div>
            </div>

            {/* Forecast Table */}
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-medium">3-Month Revenue Forecast</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Month</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Projected Revenue</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Expected Collections</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Potential Billings</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecast.map((month) => (
                    <tr key={month.month} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(month.projectedRevenue)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(month.expectedCollections)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(month.potentialBillings)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(month.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
