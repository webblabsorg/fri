'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
        <p className="text-gray-600">
          Detailed metrics and insights for platform performance
        </p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics Dashboard</CardTitle>
          <CardDescription>
            Comprehensive analytics with charts and detailed metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              Advanced analytics dashboard with interactive charts is under development.
            </p>
            <div className="text-left max-w-md mx-auto text-sm text-gray-600 space-y-1">
              <p>• User metrics (DAU, MAU, churn rate)</p>
              <p>• Engagement metrics (tool runs per user, session duration)</p>
              <p>• Conversion metrics (free → paid conversion rate)</p>
              <p>• Revenue metrics (MRR, ARR, ARPU, LTV)</p>
              <p>• Technical metrics (API uptime, error rates, latency)</p>
              <p>• AI cost monitoring (spend by model, tier, user, tool)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
