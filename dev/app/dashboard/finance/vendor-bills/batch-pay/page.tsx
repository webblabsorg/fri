'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Printer,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'
import { toast } from 'sonner'

interface VendorBill {
  id: string
  billNumber: string
  vendorName: string
  totalAmount: number
  balanceDue: number
  dueDate: string
  isOverdue: boolean
  selected: boolean
}

export default function BatchPayPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganization()
  const [bills, setBills] = useState<VendorBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('ach')
  const [results, setResults] = useState<{ successful: number; failed: number } | null>(null)
  const [checkRunData, setCheckRunData] = useState<any>(null)
  const [showCheckPreview, setShowCheckPreview] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadBills()
    }
  }, [currentOrganization?.id])

  const loadBills = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/vendor-bills?organizationId=${currentOrganization?.id}&status=approved&limit=100`
      )
      if (!res.ok) throw new Error('Failed to fetch bills')
      const data = await res.json()

      const now = new Date()
      setBills(
        (data.bills || [])
          .filter((b: any) => Number(b.balanceDue) > 0)
          .map((b: any) => {
            const balanceDue = Number(b.balanceDue)
            const dueDate = new Date(b.dueDate)
            return {
              id: b.id,
              billNumber: b.billNumber,
              vendorName: b.vendor?.name || 'Unknown',
              totalAmount: Number(b.totalAmount),
              balanceDue,
              dueDate: b.dueDate,
              isOverdue: dueDate < now,
              selected: false,
            }
          })
      )
    } catch (error) {
      console.error('Error loading bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBill = (id: string) => {
    setBills(bills.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b)))
  }

  const selectAll = () => {
    const allSelected = bills.every((b) => b.selected)
    setBills(bills.map((b) => ({ ...b, selected: !allSelected })))
  }

  const selectedBills = bills.filter((b) => b.selected)
  const totalSelected = selectedBills.reduce((sum, b) => sum + b.balanceDue, 0)

  const handleBatchPay = async () => {
    if (selectedBills.length === 0) {
      toast.error('Please select at least one bill')
      return
    }

    setIsSubmitting(true)
    setResults(null)

    try {
      const res = await fetch('/api/vendor-bills/batch-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization?.id,
          payments: selectedBills.map((bill) => ({
            vendorBillId: bill.id,
            amount: bill.balanceDue,
            paymentMethod,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process batch payment')
      }

      setResults({
        successful: data.results.filter((r: any) => r.success).length,
        failed: data.results.filter((r: any) => !r.success).length,
      })

      if (data.results.every((r: any) => r.success)) {
        toast.success(`Successfully paid ${data.results.length} bills`)
      } else {
        toast.warning(`Paid ${data.results.filter((r: any) => r.success).length} bills, ${data.results.filter((r: any) => !r.success).length} failed`)
      }

      loadBills()
    } catch (error) {
      console.error('Error processing batch payment:', error)
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintChecks = async () => {
    if (selectedBills.length === 0) {
      toast.error('Please select at least one bill')
      return
    }

    setIsSubmitting(true)
    setCheckRunData(null)

    try {
      const res = await fetch('/api/vendor-bills/check-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization?.id,
          billIds: selectedBills.map((b) => b.id),
          consolidateByVendor: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create check run')
      }

      setCheckRunData(data)
      setShowCheckPreview(true)
      toast.success(`Check run created: ${data.checkRun.checkCount} check(s)`)
      loadBills()
    } catch (error) {
      console.error('Error creating check run:', error)
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance/vendor-bills" className="rounded-lg p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Batch Pay</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay multiple vendor bills at once
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {results && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium">Batch Payment Complete</h3>
                <p className="text-sm text-muted-foreground">
                  {results.successful} successful, {results.failed} failed
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="font-medium">Approved Bills</h2>
                <button
                  onClick={selectAll}
                  className="text-sm text-primary hover:underline"
                >
                  {bills.every((b) => b.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {isLoading ? (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  Loading bills...
                </div>
              ) : bills.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  No approved bills with balance due
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {bills.map((bill) => (
                    <div
                      key={bill.id}
                      className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted ${
                        bill.selected ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => toggleBill(bill.id)}
                    >
                      <input
                        type="checkbox"
                        checked={bill.selected}
                        onChange={() => toggleBill(bill.id)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{bill.billNumber}</p>
                          {bill.isOverdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              <AlertCircle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{bill.vendorName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${bill.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due {new Date(bill.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bills Selected</span>
                  <span className="font-medium">{selectedBills.length}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-xl font-bold">
                      ${totalSelected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Payment Method</h2>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
              >
                <option value="ach">ACH Transfer</option>
                <option value="check">Check</option>
                <option value="wire">Wire Transfer</option>
              </select>
            </div>

            <button
              onClick={handleBatchPay}
              disabled={selectedBills.length === 0 || isSubmitting || paymentMethod === 'check'}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <CreditCard className="h-5 w-5" />
              {isSubmitting
                ? 'Processing...'
                : `Pay ${selectedBills.length} Bill${selectedBills.length !== 1 ? 's' : ''}`}
            </button>

            {paymentMethod === 'check' && (
              <button
                onClick={handlePrintChecks}
                disabled={selectedBills.length === 0 || isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Printer className="h-5 w-5" />
                {isSubmitting
                  ? 'Creating Check Run...'
                  : `Print ${selectedBills.length} Check${selectedBills.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {showCheckPreview && checkRunData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Check Run Created</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {checkRunData.checkRun.checkCount} check(s) generated • Total: $
              {checkRunData.checkRun.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>

            <div className="mt-4 space-y-3">
              {checkRunData.printData?.map((check: any, index: number) => (
                <div key={index} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Check #{check.checkNumber}</p>
                      <p className="text-sm text-muted-foreground">{check.payee}</p>
                    </div>
                    <p className="text-lg font-bold">
                      ${check.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{check.amountInWords}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Memo: {check.memo}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCheckPreview(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print()
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Printer className="h-4 w-4" />
                Print Checks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
