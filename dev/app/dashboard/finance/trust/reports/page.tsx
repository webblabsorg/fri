'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  ChevronRight,
  Download,
  Calendar,
  Building2,
  Users,
  Scale,
  DollarSign,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  endpoint: string
}

const reportTypes: ReportType[] = [
  {
    id: 'client-ledger',
    name: 'Client Ledger Report',
    description: 'Detailed transaction history for each client trust ledger',
    icon: <Users className="h-6 w-6" />,
    endpoint: '/api/trust/reports/client-ledger',
  },
  {
    id: 'reconciliation',
    name: 'Reconciliation Report',
    description: 'Three-way reconciliation summary and details',
    icon: <Scale className="h-6 w-6" />,
    endpoint: '/api/trust/reports/reconciliation',
  },
  {
    id: 'transaction-register',
    name: 'Transaction Register',
    description: 'Complete list of all trust account transactions',
    icon: <FileText className="h-6 w-6" />,
    endpoint: '/api/trust/reports/transaction-register',
  },
  {
    id: 'interest-distribution',
    name: 'Interest Distribution Report',
    description: 'IOLTA interest calculation and distribution details',
    icon: <DollarSign className="h-6 w-6" />,
    endpoint: '/api/trust/reports/interest-distribution',
  },
]

export default function TrustReportsPage() {
  const { currentOrganization } = useOrganization()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })


  const generateReport = async (reportType: ReportType) => {
    if (!currentOrganization?.id) return
    
    setSelectedReport(reportType.id)
    setIsGenerating(true)
    setErrorMessage('')
    setReportData(null)

    try {
      const params = new URLSearchParams({
        organizationId: currentOrganization.id,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      // For interest distribution, add period params
      if (reportType.id === 'interest-distribution') {
        params.set('periodStart', dateRange.startDate)
        params.set('periodEnd', dateRange.endDate)
      }

      const response = await fetch(`${reportType.endpoint}?${params}`)
      if (!response.ok) {
        throw new Error('Failed to generate report')
      }
      const data = await response.json()
      setReportData(data)
    } catch (err) {
      console.error('Error generating report:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = () => {
    if (!reportData) return
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trust-report-${selectedReport}-${dateRange.startDate}-${dateRange.endDate}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
              <span className="text-white">Reports</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Trust Reports</h1>
            <p className="mt-1 text-sm text-gray-400">
              Generate audit-ready trust accounting reports
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Date Range Selector */}
        <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Report Period
          </h3>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => generateReport(report)}
              disabled={isGenerating}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedReport === report.id
                  ? 'border-white bg-white/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  {report.icon}
                </div>
                <div>
                  <h3 className="text-white font-medium">{report.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{report.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {errorMessage ? (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400">
            {errorMessage}
          </div>
        ) : null}

        {/* Report Output */}
        {isGenerating && (
          <div className="p-8 text-center text-gray-400 rounded-lg border border-white/10 bg-white/5">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
            Generating report...
          </div>
        )}

        {reportData && !isGenerating && (
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-medium">
                {reportTypes.find(r => r.id === selectedReport)?.name}
              </h3>
              <button
                onClick={downloadReport}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Report Info */}
        <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="text-white font-medium mb-2">Report Formats</h3>
          <p className="text-sm text-gray-400 mb-3">
            Reports can be exported in the following formats:
          </p>
          <div className="flex flex-wrap gap-2">
            {['JSON', 'PDF (coming soon)', 'Excel (coming soon)', 'CSV (coming soon)'].map((format) => (
              <span
                key={format}
                className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white border border-white/20"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
