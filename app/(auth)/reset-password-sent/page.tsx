'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ResetPasswordSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="text-6xl">📧</div>
          </div>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We've sent you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              If an account exists with the email you provided, you will receive a password reset
              link shortly.
            </p>
            <p className="text-sm text-gray-600">The link will expire in 1 hour.</p>
          </div>

          <div className="space-y-2 pt-4">
            <p className="text-sm text-center text-gray-600">Didn't receive the email?</p>
            <ul className="text-sm text-gray-600 space-y-1 pl-5 list-disc">
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <div className="pt-4 space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/request-reset">Request another link</Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/signin">Back to sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
