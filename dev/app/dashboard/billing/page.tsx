'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SubscriptionData {
  subscription: {
    tier: string
    status: string
    hasStripeCustomer: boolean
  }
  invoices: Array<{
    id: string
    amount: number
    currency: string
    status: string
    date: string
    invoicePdf: string
  }>
  paymentMethods: Array<{
    id: string
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }>
  upcomingInvoice: {
    amount: number
    currency: string
    date: string
  } | null
}

interface UsageData {
  tier: string
  currentPeriod: {
    start: Date
    end: Date
  }
  usage: {
    requests: number
    tokens: number
    cost: number
  }
  quotas: {
    maxRequests: number
    maxTokens: number
    maxCost: number
  }
  remaining: {
    requests: number
    tokens: number
    cost: number
  }
}

const PRICING_PLANS = {
  FREE: { name: 'Free', price: 0, features: ['50 AI requests/month', '100k tokens', 'Gemini Flash', 'Basic support'] },
  PRO: { name: 'Pro', price: 49, features: ['1,000 AI requests/month', '5M tokens', 'Claude Sonnet', 'Priority support', 'API access'] },
  PROFESSIONAL: { name: 'Professional', price: 149, features: ['5,000 AI requests/month', '20M tokens', 'Claude Sonnet', 'Team collaboration', 'Custom integrations'] },
  ENTERPRISE: { name: 'Enterprise', price: 499, features: ['Unlimited requests', 'Unlimited tokens', 'Claude Opus', 'Dedicated support', 'SLA guarantee'] },
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check for success/cancelled messages
    if (searchParams.get('success')) {
      setMessage('Subscription updated successfully!')
    } else if (searchParams.get('cancelled')) {
      setMessage('Checkout cancelled')
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch subscription and usage data in parallel
      const [subscriptionResponse, usageResponse] = await Promise.all([
        fetch('/api/stripe/subscription'),
        fetch('/api/ai/usage'),
      ])

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json()
        setData(subscriptionData)
      }

      if (usageResponse.ok) {
        const usage = await usageResponse.json()
        setUsageData(usage)
      } else {
        setUsageError('Unable to load usage statistics')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setUsageError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: string) => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout')
    } finally {
      setUpgrading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        alert('Failed to open billing portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>Loading billing information...</p>
        </div>
      </div>
    )
  }

  const currentTier = data?.subscription.tier.toUpperCase() || 'FREE'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            {message}
          </div>
        )}

        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">
                  {PRICING_PLANS[currentTier as keyof typeof PRICING_PLANS]?.name || 'Free'}
                </h3>
                <p className="text-gray-600">
                  ${PRICING_PLANS[currentTier as keyof typeof PRICING_PLANS]?.price || 0}/month
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Status: <span className="capitalize">{data?.subscription.status}</span>
                </p>
              </div>
              {data?.subscription.hasStripeCustomer && (
                <Button onClick={handleManageBilling}>
                  Manage Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Stats */}
        {usageData ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Usage This Month</CardTitle>
              <CardDescription>
                Current billing period: {new Date(usageData.currentPeriod.start).toLocaleDateString()} - {new Date(usageData.currentPeriod.end).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Requests */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm text-gray-600">AI Requests</p>
                    <p className="text-xs text-gray-500">
                      {usageData.quotas.maxRequests === Infinity 
                        ? 'Unlimited' 
                        : `${usageData.remaining.requests} remaining`}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{usageData.usage.requests.toLocaleString()}</p>
                    {usageData.quotas.maxRequests !== Infinity && (
                      <p className="text-sm text-gray-500">/ {usageData.quotas.maxRequests.toLocaleString()}</p>
                    )}
                  </div>
                  {usageData.quotas.maxRequests !== Infinity && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (usageData.usage.requests / usageData.quotas.maxRequests) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Tokens */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm text-gray-600">Tokens</p>
                    <p className="text-xs text-gray-500">
                      {usageData.quotas.maxTokens === Infinity 
                        ? 'Unlimited' 
                        : `${(usageData.remaining.tokens / 1000).toFixed(0)}k remaining`}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{(usageData.usage.tokens / 1000).toFixed(1)}k</p>
                    {usageData.quotas.maxTokens !== Infinity && (
                      <p className="text-sm text-gray-500">/ {(usageData.quotas.maxTokens / 1000).toFixed(0)}k</p>
                    )}
                  </div>
                  {usageData.quotas.maxTokens !== Infinity && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (usageData.usage.tokens / usageData.quotas.maxTokens) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Cost */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm text-gray-600">Cost</p>
                    <p className="text-xs text-gray-500">
                      {usageData.quotas.maxCost === Infinity || usageData.quotas.maxCost === 0
                        ? currentTier === 'FREE' ? 'Free tier' : 'Unlimited'
                        : `$${usageData.remaining.cost.toFixed(2)} remaining`}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">${usageData.usage.cost.toFixed(2)}</p>
                    {usageData.quotas.maxCost !== Infinity && usageData.quotas.maxCost > 0 && (
                      <p className="text-sm text-gray-500">/ ${usageData.quotas.maxCost.toFixed(2)}</p>
                    )}
                  </div>
                  {usageData.quotas.maxCost !== Infinity && usageData.quotas.maxCost > 0 && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (usageData.usage.cost / usageData.quotas.maxCost) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : usageError ? (
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-amber-600">⚠️ {usageError}</p>
            </CardContent>
          </Card>
        ) : null}

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Upgrade Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(PRICING_PLANS).map(([key, plan]) => (
              <Card key={key} className={currentTier === key ? 'border-blue-500 border-2' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && '/month'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {currentTier === key ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : key === 'FREE' ? (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full"
                    >
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(key)}
                      disabled={upgrading}
                      className="w-full"
                    >
                      {upgrading ? 'Processing...' : 'Upgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Invoice */}
        {data?.upcomingInvoice && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upcoming Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Next billing date</p>
                  <p className="font-semibold">
                    {new Date(data.upcomingInvoice.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount due</p>
                  <p className="text-2xl font-bold">
                    ${data.upcomingInvoice.amount.toFixed(2)} {data.upcomingInvoice.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        {data?.paymentMethods && data.paymentMethods.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {data.paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center p-3 border rounded-lg mb-2">
                  <div className="flex-1">
                    <p className="font-semibold capitalize">{pm.brand} •••• {pm.last4}</p>
                    <p className="text-sm text-gray-600">
                      Expires {pm.expMonth}/{pm.expYear}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        {data?.invoices && data.invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">
                        ${invoice.amount.toFixed(2)} {invoice.currency}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm capitalize ${
                        invoice.status === 'paid' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.invoicePdf && (
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>Loading billing information...</p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}
