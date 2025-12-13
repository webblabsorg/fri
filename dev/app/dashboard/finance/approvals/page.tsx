'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Receipt,
  DollarSign,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface ApprovalRequest {
  id: string
  entityType: string
  entityId: string
  amount: number
  description: string | null
  status: string
  currentLevel: number
  requestedAt: string
  requestedBy: string
  workflow: {
    name: string
    levels: Array<{ levelNumber: number; name: string }>
  }
}

export default function ApprovalsPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadPendingApprovals()
    }
  }, [currentOrganization?.id])

  const loadPendingApprovals = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/approval-workflows/pending?organizationId=${currentOrganization.id}`)
      if (!res.ok) throw new Error('Failed to fetch approvals')
      const data = await res.json()
      setPendingApprovals(
        (data.approvals || []).map((a: any) => ({
          ...a,
          amount: Number(a.amount),
        }))
      )
    } catch (error) {
      console.error('Error loading approvals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: 'approved' | 'rejected', comments?: string) => {
    if (!currentOrganization?.id) return
    setProcessingId(requestId)
    try {
      const res = await fetch(`/api/approval-workflows/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          action,
          comments,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to ${action} request`)
      }
      toast.success(`Request ${action}`)
      loadPendingApprovals()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setProcessingId(null)
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'expense':
        return <Receipt className="h-5 w-5 text-blue-600" />
      case 'vendor_bill':
        return <FileText className="h-5 w-5 text-purple-600" />
      case 'invoice':
        return <DollarSign className="h-5 w-5 text-green-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'expense':
        return 'Expense'
      case 'vendor_bill':
        return 'Vendor Bill'
      case 'invoice':
        return 'Invoice'
      default:
        return entityType
    }
  }

  const getEntityLink = (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'expense':
        return `/dashboard/finance/expenses/${entityId}`
      case 'vendor_bill':
        return `/dashboard/finance/vendor-bills/${entityId}`
      case 'invoice':
        return `/dashboard/finance/billing/${entityId}`
      default:
        return '#'
    }
  }

  if (orgLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading approvals...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pending Approvals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and approve expenses, bills, and invoices
            </p>
          </div>
          <Link
            href="/dashboard/finance/approvals/workflows"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Manage Workflows
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="p-6">
        {pendingApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-lg font-medium">All caught up!</h2>
            <p className="mt-2 text-muted-foreground">No pending approvals at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      {getEntityIcon(approval.entityType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          {getEntityLabel(approval.entityType)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {approval.workflow.name}
                        </span>
                      </div>
                      <Link
                        href={getEntityLink(approval.entityType, approval.entityId)}
                        className="mt-1 block text-lg font-medium hover:underline"
                      >
                        {approval.description || `${getEntityLabel(approval.entityType)} #${approval.entityId.slice(0, 8)}`}
                      </Link>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          ${approval.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span>•</span>
                        <span>
                          Level {approval.currentLevel}: {approval.workflow.levels.find(l => l.levelNumber === approval.currentLevel)?.name || 'Approval'}
                        </span>
                        <span>•</span>
                        <span>
                          Requested {new Date(approval.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(approval.id, 'rejected')}
                      disabled={processingId === approval.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(approval.id, 'approved')}
                      disabled={processingId === approval.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
