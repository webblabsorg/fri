'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronRight,
  RefreshCw,
  Upload,
  FileText,
  Calendar,
  CheckCircle,
  X,
} from 'lucide-react'
import { useOrganization } from '@/components/providers/OrganizationProvider'

interface TrustAccount {
  id: string
  accountName: string
  bankName: string
  currency: string
}

interface ImportedStatement {
  id: string
  statementDate: string
  periodStart: string
  periodEnd: string
  openingBalance: number
  closingBalance: number
  fileUrl?: string
  _count: { transactions: number }
  createdAt: string
}

export default function StatementsPage() {
  const params = useParams()
  const accountId = params.id as string
  const { currentOrganization } = useOrganization()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [account, setAccount] = useState<TrustAccount | null>(null)
  const [statements, setStatements] = useState<ImportedStatement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (accountId && currentOrganization?.id) {
      loadData()
    }
  }, [accountId, currentOrganization?.id])

  const loadData = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const accountRes = await fetch(
        `/api/trust/accounts/${accountId}?organizationId=${currentOrganization.id}`
      )
      if (!accountRes.ok) throw new Error('Failed to load account')
      const accountData = await accountRes.json()
      setAccount(accountData.account)
      
      // Load statements
      const statementsRes = await fetch(
        `/api/trust/accounts/${accountId}/statements?organizationId=${currentOrganization.id}`
      )
      if (statementsRes.ok) {
        const statementsData = await statementsRes.json()
        setStatements(statementsData.statements || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!currentOrganization?.id) return
    
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'text/plain',
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|ofx|qfx)$/i)) {
      setError('Please upload a CSV, OFX, or QFX file')
      return
    }
    
    setIsUploading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organizationId', currentOrganization.id)
      // The API will compute balances from file if possible; provide fallback of 0 if needed
      formData.append('openingBalance', '0')
      formData.append('closingBalance', '0')
      
      const res = await fetch(`/api/trust/accounts/${accountId}/statements`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to import statement')
      }
      
      setSuccessMessage(`Successfully imported ${file.name}`)
      loadData()
    } catch (err) {
      console.error('Error importing statement:', err)
      setError(err instanceof Error ? err.message : 'Failed to import statement')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !account) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            href="/dashboard/finance/trust"
            className="text-white hover:underline"
          >
            ← Back to Trust Accounts
          </Link>
        </div>
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
              <Link href="/dashboard/finance/trust" className="hover:text-white">Trust</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/dashboard/finance/trust/${accountId}`} className="hover:text-white">
                {account?.accountName}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Statements</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Bank Statements</h1>
            <p className="mt-1 text-sm text-gray-400">
              Import and manage bank statements for reconciliation
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`mb-6 p-8 rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-white bg-white/10'
              : 'border-white/20 hover:border-white/40'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-white font-medium mb-2">Import Bank Statement</h3>
            <p className="text-sm text-gray-400 mb-4">
              Drag and drop a file here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx,.qfx"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Choose File
                </>
              )}
            </label>
            <p className="mt-3 text-xs text-gray-500">
              Supported formats: CSV, OFX, QFX
            </p>
          </div>
        </div>

        {/* Imported Statements */}
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-medium">Imported Statements</h3>
          </div>
          {statements.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No statements imported yet</p>
              <p className="text-sm mt-1">
                Import your first bank statement to begin reconciliation
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {statements.map((statement) => (
                <div
                  key={statement.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-white font-medium">
                        Statement {new Date(statement.statementDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(statement.periodStart).toLocaleDateString()} -{' '}
                        {new Date(statement.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-white">{statement._count.transactions} transactions</p>
                      <p className="text-xs text-gray-400">
                        Imported {new Date(statement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-400/10 text-green-400 border border-green-400/30">
                      imported
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
