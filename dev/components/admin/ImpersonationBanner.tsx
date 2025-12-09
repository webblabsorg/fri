'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonationData, setImpersonationData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkImpersonationStatus()
  }, [])

  const checkImpersonationStatus = () => {
    // Check if impersonation cookie exists
    const cookies = document.cookie.split(';')
    const impersonationCookie = cookies.find((c) =>
      c.trim().startsWith('impersonation=')
    )

    if (impersonationCookie) {
      try {
        const data = JSON.parse(
          decodeURIComponent(impersonationCookie.split('=')[1])
        )
        setIsImpersonating(true)
        setImpersonationData(data)
      } catch (error) {
        console.error('Failed to parse impersonation cookie:', error)
      }
    }
  }

  const exitImpersonation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users/exit-impersonation', {
        method: 'POST',
      })

      if (response.ok) {
        // Reload page to restore admin session
        window.location.href = '/admin/users'
      } else {
        alert('Failed to exit impersonation')
      }
    } catch (error) {
      console.error('Failed to exit impersonation:', error)
      alert('Failed to exit impersonation')
    } finally {
      setLoading(false)
    }
  }

  if (!isImpersonating) {
    return null
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-3 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-semibold">
              ⚠️ IMPERSONATION MODE ACTIVE
            </p>
            <p className="text-sm opacity-90">
              You are impersonating a user.
              {impersonationData?.startedAt && (
                <span className="ml-2">
                  Started: {new Date(impersonationData.startedAt).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={exitImpersonation}
          disabled={loading}
          className="bg-white text-amber-900 hover:bg-amber-50 border-amber-300"
        >
          {loading ? 'Exiting...' : 'Exit Impersonation'}
        </Button>
      </div>
    </div>
  )
}
