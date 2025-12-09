'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default function WelcomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        
        // If already completed onboarding, redirect to dashboard
        if (data.user.onboardingCompleted) {
          router.push('/dashboard')
          return
        }
        
        setUserName(data.user.name)
        setLoading(false)
      } else {
        // No session, redirect to signin
        router.push('/signin')
      }
    } catch (error) {
      console.error('Session check error:', error)
      router.push('/signin')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <OnboardingWizard userName={userName} />
}
