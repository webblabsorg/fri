'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')

  const handleResend = async () => {
    setIsResending(true)
    setMessage('')

    try {
      // Get email from session storage (set during signup)
      const email = sessionStorage.getItem('signup_email')

      if (!email) {
        setMessage('Please sign up again to receive a verification email.')
        return
      }

      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.')
      } else {
        setMessage(data.error || 'Failed to resend email. Please try again.')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="text-6xl">📧</div>
          </div>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We've sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Please check your email and click the verification link to activate your account.
            </p>
            <p className="text-sm text-gray-600">
              The link will expire in 24 hours.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('sent') 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-center text-gray-600">Didn't receive the email?</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>
          </div>

          <div className="text-center pt-4">
            <Link href="/signin" className="text-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
