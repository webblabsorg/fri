'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Receipt,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Edit,
  Trash2,
  DollarSign,
  Car,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface Expense {
  id: string
  expenseNumber: string
  description: string
  category: string
  subcategory: string | null
  amount: number
  taxAmount: number
  currency: string
  expenseDate: string
  status: string
  approvalStatus: string
  isBillable: boolean
  isBilled: boolean
  markupPercent: number | null
  billedAmount: number | null
  receiptUrl: string | null
  receiptOcrData: any
  isMileage: boolean
  mileageDistance: number | null
  mileageRate: number | null
  mileageStart: string | null
  mileageEnd: string | null
  paymentMethod: string | null
  reimbursed: boolean
  policyViolation: boolean
  policyViolationReason: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  createdAt: string
  matter: { id: string; name: string; client: { displayName: string } } | null
  client: { id: string; displayName: string } | null
  vendor: { id: string; name: string } | null
}

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentOrganization } = useOrganization()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (currentOrganization?.id && id) {
      loadExpense()
    }
  }, [currentOrganization?.id, id])

  const loadExpense = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/expenses/${id}?organizationId=${currentOrganization?.id}`)
      if (!res.ok) throw new Error('Failed to fetch expense')
      const data = await res.json()
      setExpense({
        ...data.expense,
        amount: Number(data.expense.amount),
        taxAmount: Number(data.expense.taxAmount),
        markupPercent: data.expense.markupPercent ? Number(data.expense.markupPercent) : null,
        billedAmount: data.expense.billedAmount ? Number(data.expense.billedAmount) : null,
        mileageDistance: data.expense.mileageDistance ? Number(data.expense.mileageDistance) : null,
        mileageRate: data.expense.mileageRate ? Number(data.expense.mileageRate) : null,
      })
    } catch (error) {
      console.error('Error loading expense:', error)
      toast.error('Failed to load expense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!expense || !currentOrganization?.id) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/expenses/${expense.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit expense')
      }
      toast.success('Expense submitted for approval')
      loadExpense()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!expense || !currentOrganization?.id) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/expenses/${expense.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve expense')
      }
      toast.success('Expense approved')
      loadExpense()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!expense || !currentOrganization?.id || !rejectionReason) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/expenses/${expense.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id, reason: rejectionReason }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reject expense')
      }
      toast.success('Expense rejected')
      setShowRejectModal(false)
      setRejectionReason('')
      loadExpense()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!expense || !currentOrganization?.id) return
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      const res = await fetch(`/api/expenses/${expense.id}?organizationId=${currentOrganization.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete expense')
      }
      toast.success('Expense deleted')
      router.push('/dashboard/finance/expenses')
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
      draft: { bg: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-4 w-4" /> },
      submitted: { bg: 'bg-blue-100 text-blue-800', icon: <Send className="h-4 w-4" /> },
      pending_approval: { bg: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
      approved: { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
      rejected: { bg: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
      paid: { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
    }
    return styles[status] || styles.draft
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      paid: 'Paid',
    }
    return labels[status] || status
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading expense...</div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Expense not found</h2>
          <Link href="/dashboard/finance/expenses" className="mt-4 text-primary hover:underline">
            Back to expenses
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusBadge(expense.status)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/finance/expenses" className="rounded-lg p-2 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{expense.expenseNumber}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bg}`}>
                  {statusInfo.icon}
                  {getStatusLabel(expense.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{expense.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expense.status === 'draft' && (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
            {(expense.status === 'submitted' || expense.status === 'pending_approval') && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {expense.policyViolation && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Policy Violation</h3>
                    <p className="mt-1 text-sm text-yellow-700">{expense.policyViolationReason}</p>
                  </div>
                </div>
              </div>
            )}

            {expense.rejectionReason && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="font-medium text-red-800">Rejection Reason</h3>
                    <p className="mt-1 text-sm text-red-700">{expense.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Expense Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd className="mt-1 font-medium capitalize">{expense.category.replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Date</dt>
                  <dd className="mt-1 font-medium">{new Date(expense.expenseDate).toLocaleDateString()}</dd>
                </div>
                {expense.isMileage ? (
                  <>
                    <div>
                      <dt className="text-sm text-muted-foreground">Mileage</dt>
                      <dd className="mt-1 font-medium flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        {expense.mileageDistance} miles @ ${expense.mileageRate}/mi
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Route</dt>
                      <dd className="mt-1 font-medium">
                        {expense.mileageStart || 'N/A'} → {expense.mileageEnd || 'N/A'}
                      </dd>
                    </div>
                  </>
                ) : (
                  <div>
                    <dt className="text-sm text-muted-foreground">Tax Amount</dt>
                    <dd className="mt-1 font-medium">${expense.taxAmount.toFixed(2)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Payment Method</dt>
                  <dd className="mt-1 font-medium capitalize">{expense.paymentMethod?.replace('_', ' ') || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Billable</dt>
                  <dd className="mt-1 font-medium">{expense.isBillable ? 'Yes' : 'No'}</dd>
                </div>
                {expense.isBillable && expense.markupPercent && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Markup</dt>
                    <dd className="mt-1 font-medium">{expense.markupPercent}%</dd>
                  </div>
                )}
              </dl>
            </div>

            {expense.matter && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-medium">Matter Assignment</h2>
                <div>
                  <p className="font-medium">{expense.matter.name}</p>
                  <p className="text-sm text-muted-foreground">{expense.matter.client.displayName}</p>
                </div>
              </div>
            )}

            {expense.vendor && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-medium">Vendor</h2>
                <p className="font-medium">{expense.vendor.name}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Amount</h2>
              <div className="text-3xl font-bold text-foreground">
                ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{expense.currency}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Receipt</h2>
              {expense.receiptUrl ? (
                <div>
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Receipt className="h-4 w-4" />
                    View Receipt
                  </a>
                  {expense.receiptOcrData && (
                    <div className="mt-3 rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">OCR Data Available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No receipt uploaded</p>
                  {expense.status === 'draft' && (
                    <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      Upload Receipt
                    </button>
                  )}
                </div>
              )}
            </div>

            {expense.approvedAt && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-medium">Approval Info</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Status</dt>
                    <dd className="font-medium capitalize">{expense.approvalStatus}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Date</dt>
                    <dd className="font-medium">{new Date(expense.approvedAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Reject Expense</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please provide a reason for rejecting this expense.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
              placeholder="Rejection reason..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || isSubmitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
