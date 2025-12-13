'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Download,
  Calendar,
} from 'lucide-react'

interface ReportCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  category: 'billing' | 'trust' | 'expenses'
}

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const reports: ReportCard[] = [
    {
      id: 'ar-aging',
      title: 'A/R Aging Report',
      description: 'View outstanding invoices by aging bucket',
      icon: <Clock className="h-6 w-6" />,
      href: '/dashboard/finance/reports/ar-aging',
      category: 'billing',
    },
    {
      id: 'collections',
      title: 'Collections Report',
      description: 'Track payment collections over time',
      icon: <DollarSign className="h-6 w-6" />,
      href: '/dashboard/finance/reports/collections',
      category: 'billing',
    },
    {
      id: 'wip',
      title: 'Work in Progress',
      description: 'Unbilled time and expenses by matter',
      icon: <TrendingUp className="h-6 w-6" />,
      href: '/dashboard/finance/reports/wip',
      category: 'billing',
    },
    {
      id: 'revenue-forecast',
      title: 'Revenue Forecast',
      description: 'AI-powered revenue projections',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/dashboard/finance/reports/revenue-forecast',
      category: 'billing',
    },
    {
      id: 'client-ledger',
      title: 'Client Ledger Report',
      description: 'Trust account balances by client',
      icon: <Users className="h-6 w-6" />,
      href: '/dashboard/finance/reports/client-ledger',
      category: 'trust',
    },
    {
      id: 'reconciliation',
      title: 'Reconciliation Report',
      description: 'Trust account reconciliation history',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/finance/reports/reconciliation',
      category: 'trust',
    },
    {
      id: 'transaction-register',
      title: 'Transaction Register',
      description: 'Complete trust transaction history',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/finance/reports/transaction-register',
      category: 'trust',
    },
    {
      id: 'expense-by-category',
      title: 'Expenses by Category',
      description: 'Expense breakdown by category',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/dashboard/finance/reports/expense-by-category',
      category: 'expenses',
    },
    {
      id: 'expense-by-matter',
      title: 'Expenses by Matter',
      description: 'Expense breakdown by matter',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/finance/reports/expense-by-matter',
      category: 'expenses',
    },
    {
      id: '1099',
      title: '1099 Report',
      description: 'Vendor payments for tax reporting',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/finance/reports/1099',
      category: 'expenses',
    },
  ]

  const filteredReports = reports.filter(
    (report) => selectedCategory === 'all' || report.category === selectedCategory
  )

  const categories = [
    { id: 'all', label: 'All Reports' },
    { id: 'billing', label: 'Billing' },
    { id: 'trust', label: 'Trust Accounting' },
    { id: 'expenses', label: 'Expenses' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Financial Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate and view financial reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <Calendar className="h-4 w-4" />
              Date Range
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 flex gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <Link
              key={report.id}
              href={report.href}
              className="group rounded-lg border border-border bg-card p-6 transition-all hover:bg-muted"
            >
              <div className="mb-4 inline-flex rounded-lg bg-muted p-3 text-foreground">
                {report.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{report.title}</h3>
              <p className="text-sm text-muted-foreground">{report.description}</p>
              <div className="mt-4">
                <span className="inline-block rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                  {report.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
