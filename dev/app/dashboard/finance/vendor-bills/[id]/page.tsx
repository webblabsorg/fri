'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  CreditCard,
  Building2,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface VendorCredit {
  id: string
  creditNumber: string
  amount: number
  remainingAmount: number
  reason: string | null
  creditDate: string
  status: string
}

interface VendorBill {
  id: string
  billNumber: string
  invoiceNumber: string | null
  description: string | null
  totalAmount: number
  paidAmount: number
  balanceDue: number
  status: string
  approvalStatus: string
  billDate: string
  dueDate: string
  scheduledPaymentDate: string | null
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  vendor: { id: string; name: string; vendorNumber: string }
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
    accountCode: string | null
  }>
  payments: Array<{
    id: string
    amount: number
    paymentMethod: string
    paymentDate: string
    referenceNumber: string | null
  }>
  creditApplications?: Array<{
    id: string
    amount: number
    appliedAt: string
    credit: { creditNumber: string }
  }>
}

export default function VendorBillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentOrganization } = useOrganization()
  const [bill, setBill] = useState<VendorBill | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [availableCredits, setAvailableCredits] = useState<VendorCredit[]>([])
  const [selectedCreditId, setSelectedCreditId] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'check',
    referenceNumber: '',
  })
  const [scheduleDate, setScheduleDate] = useState('')

  useEffect(() => {
    if (currentOrganization?.id && id) {
      loadBill()
    }
  }, [currentOrganization?.id, id])

  const loadBill = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/vendor-bills/${id}?organizationId=${currentOrganization?.id}`)
      if (!res.ok) throw new Error('Failed to fetch vendor bill')
      const data = await res.json()
      setBill({
        ...data.bill,
        totalAmount: Number(data.bill.totalAmount),
        paidAmount: Number(data.bill.paidAmount),
        balanceDue: Number(data.bill.balanceDue),
        lineItems: data.bill.lineItems.map((li: any) => ({
          ...li,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
          amount: Number(li.amount),
        })),
        payments: data.bill.payments.map((p: any) => ({
          ...p,
          amount: Number(p.amount),
        })),
      })
      setPaymentData((prev) => ({
        ...prev,
        amount: Number(data.bill.balanceDue).toFixed(2),
      }))
    } catch (error) {
      console.error('Error loading vendor bill:', error)
      toast.error('Failed to load vendor bill')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!bill || !currentOrganization?.id) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/vendor-bills/${bill.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve bill')
      }
      toast.success('Bill approved')
      loadBill()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePay = async () => {
    if (!bill || !currentOrganization?.id) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/vendor-bills/${bill.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          referenceNumber: paymentData.referenceNumber || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to pay bill')
      }
      toast.success('Payment recorded')
      setShowPayModal(false)
      loadBill()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadAvailableCredits = async () => {
    if (!bill || !currentOrganization?.id) return
    try {
      const res = await fetch(
        `/api/vendor-credits?organizationId=${currentOrganization.id}&vendorId=${bill.vendor.id}&status=active`
      )
      if (res.ok) {
        const data = await res.json()
        setAvailableCredits(
          (data.credits || [])
            .filter((c: VendorCredit) => c.remainingAmount > 0)
            .map((c: any) => ({
              ...c,
              amount: Number(c.amount),
              remainingAmount: Number(c.remainingAmount),
            }))
        )
      }
    } catch (error) {
      console.error('Error loading credits:', error)
    }
  }

  const handleApplyCredit = async () => {
    if (!bill || !currentOrganization?.id || !selectedCreditId || !creditAmount) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/vendor-credits/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          creditId: selectedCreditId,
          billId: bill.id,
          amount: parseFloat(creditAmount),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to apply credit')
      }
      toast.success('Credit applied successfully')
      setShowCreditModal(false)
      setSelectedCreditId('')
      setCreditAmount('')
      loadBill()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSchedule = async () => {
    if (!bill || !currentOrganization?.id || !scheduleDate) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/vendor-bills/${bill.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          scheduledPaymentDate: scheduleDate,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to schedule payment')
      }
      toast.success('Payment scheduled')
      setShowScheduleModal(false)
      loadBill()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOverdue = () => {
    if (!bill) return false
    return (
      bill.balanceDue > 0 &&
      new Date(bill.dueDate) < new Date() &&
      bill.status !== 'paid' &&
      bill.status !== 'cancelled'
    )
  }

  const getStatusBadge = (status: string) => {
    if (isOverdue()) return { bg: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-4 w-4" />, label: 'Overdue' }
    const styles: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" />, label: 'Pending' },
      approved: { bg: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4" />, label: 'Approved' },
      scheduled: { bg: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-4 w-4" />, label: 'Scheduled' },
      paid: { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" />, label: 'Paid' },
      cancelled: { bg: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-4 w-4" />, label: 'Cancelled' },
    }
    return styles[status] || styles.pending
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading vendor bill...</div>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Vendor bill not found</h2>
          <Link href="/dashboard/finance/vendor-bills" className="mt-4 text-primary hover:underline">
            Back to vendor bills
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusBadge(bill.status)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/finance/vendor-bills" className="rounded-lg p-2 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{bill.billNumber}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bg}`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {bill.vendor.name} • {bill.invoiceNumber || 'No invoice #'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bill.status === 'pending' && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
            )}
            {(bill.status === 'approved' || bill.status === 'scheduled') && bill.balanceDue > 0 && (
              <>
                <button
                  onClick={() => {
                    loadAvailableCredits()
                    setShowCreditModal(true)
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <DollarSign className="h-4 w-4" />
                  Apply Credit
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
                <button
                  onClick={() => setShowPayModal(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Bill Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Bill Date</dt>
                  <dd className="mt-1 font-medium">{new Date(bill.billDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Due Date</dt>
                  <dd className={`mt-1 font-medium ${isOverdue() ? 'text-red-600' : ''}`}>
                    {new Date(bill.dueDate).toLocaleDateString()}
                    {isOverdue() && ' (Overdue)'}
                  </dd>
                </div>
                {bill.scheduledPaymentDate && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Scheduled Payment</dt>
                    <dd className="mt-1 font-medium">{new Date(bill.scheduledPaymentDate).toLocaleDateString()}</dd>
                  </div>
                )}
                {bill.description && (
                  <div className="col-span-2">
                    <dt className="text-sm text-muted-foreground">Description</dt>
                    <dd className="mt-1">{bill.description}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Line Items</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-4 text-right font-medium">Total</td>
                    <td className="pt-4 text-right text-lg font-bold">${bill.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {bill.payments.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-medium">Payment History</h2>
                <div className="space-y-3">
                  {bill.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium">${payment.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod}
                          {payment.referenceNumber && ` • Ref: ${payment.referenceNumber}`}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Amount Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">${bill.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-green-600">${bill.paidAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Balance Due</span>
                    <span className={`text-xl font-bold ${bill.balanceDue > 0 ? 'text-foreground' : 'text-green-600'}`}>
                      ${bill.balanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Vendor</h2>
              <Link
                href={`/dashboard/finance/vendors/${bill.vendor.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted"
              >
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{bill.vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{bill.vendor.vendorNumber}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Record Payment</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Amount</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="check">Check</option>
                  <option value="ach">ACH</option>
                  <option value="wire">Wire Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Reference Number</label>
                <input
                  type="text"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  placeholder="Check # or transaction ID"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={!paymentData.amount || isSubmitting}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Schedule Payment</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">Payment Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={!scheduleDate || isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Apply Vendor Credit</h2>
            {availableCredits.length === 0 ? (
              <div className="mt-4 text-center text-muted-foreground">
                <p>No available credits for this vendor.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Select Credit</label>
                  <select
                    value={selectedCreditId}
                    onChange={(e) => {
                      setSelectedCreditId(e.target.value)
                      const credit = availableCredits.find((c) => c.id === e.target.value)
                      if (credit && bill) {
                        setCreditAmount(Math.min(credit.remainingAmount, bill.balanceDue).toFixed(2))
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="">Select a credit...</option>
                    {availableCredits.map((credit) => (
                      <option key={credit.id} value={credit.id}>
                        {credit.creditNumber} - ${credit.remainingAmount.toFixed(2)} available
                        {credit.reason && ` (${credit.reason})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Amount to Apply</label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      step="0.01"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      max={
                        selectedCreditId
                          ? Math.min(
                              availableCredits.find((c) => c.id === selectedCreditId)?.remainingAmount || 0,
                              bill?.balanceDue || 0
                            )
                          : undefined
                      }
                      className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>
                  {selectedCreditId && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Max: $
                      {Math.min(
                        availableCredits.find((c) => c.id === selectedCreditId)?.remainingAmount || 0,
                        bill?.balanceDue || 0
                      ).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreditModal(false)
                  setSelectedCreditId('')
                  setCreditAmount('')
                }}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              {availableCredits.length > 0 && (
                <button
                  onClick={handleApplyCredit}
                  disabled={!selectedCreditId || !creditAmount || isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Apply Credit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
