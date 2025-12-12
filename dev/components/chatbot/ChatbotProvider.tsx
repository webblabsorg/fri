'use client'

import { useEffect, useState } from 'react'
import { ChatWidget } from './ChatWidget'

interface ChatbotProviderProps {
  enabled?: boolean
  children: React.ReactNode
}

export function ChatbotProvider({ 
  enabled = true, 
  children 
}: ChatbotProviderProps) {
  const [shouldShow, setShouldShow] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [userPlan, setUserPlan] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Don't show on admin pages
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setShouldShow(false)
      return
    }

    // Don't show on auth pages
    if (typeof window !== 'undefined' && (
        window.location.pathname.includes('/sign-in') || 
        window.location.pathname.includes('/sign-up'))) {
      setShouldShow(false)
      return
    }

    setShouldShow(enabled)

    // Fetch user info if available (non-blocking)
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUserId(data.user.id)
            setUserPlan(data.user.subscriptionTier)
          }
        }
      } catch {
        // Silently fail - chatbot works without user info
      }
    }
    fetchUserInfo()
  }, [enabled])

  return (
    <>
      {children}
      {shouldShow && (
        <ChatWidget
          pageUrl={typeof window !== 'undefined' ? window.location.href : undefined}
          userId={userId}
          userPlan={userPlan}
        />
      )}
    </>
  )
}
