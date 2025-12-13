'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface CheckPrintData {
  checkNumber: string
  date: string
  payee: string
  amount: number
  amountInWords: string
  memo: string
  address?: {
    address1?: string
    address2?: string
    city?: string
    state?: string
    postalCode?: string
  }
}

export default function CheckPrintPage() {
  const searchParams = useSearchParams()
  const { currentOrganization } = useOrganization()
  const [checks, setChecks] = useState<CheckPrintData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [orgInfo, setOrgInfo] = useState<{ name: string; address?: string } | null>(null)

  const checkRunId = searchParams.get('checkRunId')

  useEffect(() => {
    if (currentOrganization?.id && checkRunId) {
      loadCheckData()
    }
  }, [currentOrganization?.id, checkRunId])

  const loadCheckData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/vendor-bills/check-run?organizationId=${currentOrganization?.id}&checkRunId=${checkRunId}`
      )
      if (res.ok) {
        const data = await res.json()
        setChecks(data.printData || [])
        setOrgInfo({ name: currentOrganization?.name || 'Organization' })
      }
    } catch (error) {
      console.error('Error loading check data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Auto-print when data is loaded
    if (!isLoading && checks.length > 0) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [isLoading, checks])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading checks...</p>
      </div>
    )
  }

  return (
    <div className="check-print-container">
      <style jsx global>{`
        @media print {
          @page {
            size: 8.5in 11in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .check-page {
            page-break-after: always;
            height: 11in;
            width: 8.5in;
          }
          .check-page:last-child {
            page-break-after: auto;
          }
        }
        @media screen {
          .check-page {
            border: 1px dashed #ccc;
            margin-bottom: 20px;
            background: white;
          }
        }
        .check-page {
          height: 11in;
          width: 8.5in;
          padding: 0.5in;
          box-sizing: border-box;
          font-family: 'Courier New', monospace;
          position: relative;
        }
        .check-stub {
          height: 3.5in;
          border-bottom: 1px dashed #999;
          padding-bottom: 0.25in;
        }
        .check-body {
          height: 3.5in;
          position: relative;
          padding-top: 0.25in;
        }
        .check-number {
          position: absolute;
          top: 0.25in;
          right: 0;
          font-size: 14px;
          font-weight: bold;
        }
        .check-date {
          position: absolute;
          top: 0.5in;
          right: 0;
          font-size: 12px;
        }
        .check-payee {
          margin-top: 0.75in;
          font-size: 14px;
        }
        .check-amount-box {
          position: absolute;
          top: 0.75in;
          right: 0;
          border: 2px solid #000;
          padding: 4px 8px;
          font-size: 14px;
          font-weight: bold;
        }
        .check-amount-words {
          margin-top: 0.25in;
          font-size: 12px;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
        }
        .check-memo {
          position: absolute;
          bottom: 0.75in;
          left: 0;
          font-size: 11px;
        }
        .check-signature-line {
          position: absolute;
          bottom: 0.5in;
          right: 0;
          width: 3in;
          border-top: 1px solid #000;
          text-align: center;
          font-size: 10px;
          padding-top: 2px;
        }
        .micr-line {
          position: absolute;
          bottom: 0.25in;
          left: 0;
          right: 0;
          font-family: 'MICR', 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 2px;
        }
        .org-header {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 0.1in;
        }
        .stub-details {
          display: flex;
          justify-content: space-between;
          margin-top: 0.25in;
          font-size: 11px;
        }
        .stub-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.25in;
          font-size: 10px;
        }
        .stub-table th, .stub-table td {
          border: 1px solid #ccc;
          padding: 4px 8px;
          text-align: left;
        }
        .stub-table th {
          background: #f5f5f5;
        }
      `}</style>

      <div className="no-print p-4 bg-yellow-50 border-b border-yellow-200">
        <p className="text-sm text-yellow-800">
          This page is optimized for printing on standard check stock (3 checks per page).
          Press Ctrl+P or Cmd+P to print.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Print Checks
        </button>
      </div>

      {checks.map((check, index) => (
        <div key={index} className="check-page">
          {/* Check Stub (top portion - kept by payer) */}
          <div className="check-stub">
            <div className="org-header">{orgInfo?.name}</div>
            <div className="stub-details">
              <div>
                <strong>Check #:</strong> {check.checkNumber}
              </div>
              <div>
                <strong>Date:</strong> {new Date(check.date).toLocaleDateString()}
              </div>
              <div>
                <strong>Amount:</strong> ${check.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <table className="stub-table">
              <thead>
                <tr>
                  <th>Pay To</th>
                  <th>Memo</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{check.payee}</td>
                  <td>{check.memo}</td>
                  <td>${check.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Actual Check */}
          <div className="check-body">
            <div className="org-header">{orgInfo?.name}</div>
            
            <div className="check-number">No. {check.checkNumber}</div>
            <div className="check-date">Date: {new Date(check.date).toLocaleDateString()}</div>
            
            <div className="check-payee">
              <strong>PAY TO THE ORDER OF:</strong> {check.payee}
            </div>
            
            <div className="check-amount-box">
              ${check.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            
            <div className="check-amount-words">
              {check.amountInWords} DOLLARS
            </div>
            
            {check.address && (
              <div style={{ marginTop: '0.25in', fontSize: '11px' }}>
                {check.address.address1}<br />
                {check.address.address2 && <>{check.address.address2}<br /></>}
                {check.address.city}, {check.address.state} {check.address.postalCode}
              </div>
            )}
            
            <div className="check-memo">
              <strong>MEMO:</strong> {check.memo}
            </div>
            
            <div className="check-signature-line">
              Authorized Signature
            </div>
            
            <div className="micr-line">
              ⑆{check.checkNumber}⑆ ⑈000000000⑈ 0000000000⑆
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
