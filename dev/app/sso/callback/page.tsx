'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SSOCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    const code = searchParams.get('code')
    const state = searchParams.get('state') // organizationId
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setStatus('error')
      setError(errorParam)
      return
    }

    if (!code || !state) {
      setStatus('error')
      setError('Missing authorization code or state')
      return
    }

    try {
      // Exchange code for user info via our API
      const response = await fetch('/api/auth/sso/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, organizationId: state }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setError(data.error || 'SSO authentication failed')
        return
      }

      // Sign in with credentials using the SSO token
      const result = await signIn('credentials', {
        email: data.email,
        ssoToken: data.ssoToken,
        redirect: false,
      })

      if (result?.error) {
        setStatus('error')
        setError(result.error)
        return
      }

      setStatus('success')
      router.push('/dashboard')
    } catch (err) {
      setStatus('error')
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        {status === 'processing' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900">Completing Sign In</h1>
            <p className="text-gray-500 mt-2">Please wait while we verify your identity...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Sign In Successful</h1>
            <p className="text-gray-500 mt-2">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Sign In Failed</h1>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={() => router.push('/signin')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
