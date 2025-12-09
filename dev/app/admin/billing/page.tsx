'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react'

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing & Revenue</h1>
        <p className="text-gray-600">
          Manage transactions, refunds, and revenue tracking
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Revenue (MRR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <p className="text-3xl font-bold">$0</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-3xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transactions This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <p className="text-3xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-3xl font-bold">—</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 45-Day Guarantee Tracking */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>45-Day Money-Back Guarantee</span>
            <span className="text-sm font-normal text-gray-600">Active Policy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Track subscriptions within the 45-day guarantee window and manage refund requests.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Within Window</p>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Refund Requests</p>
              <p className="text-2xl font-bold text-yellow-600">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Refunds Processed</p>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Full Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Management System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Integration In Progress</h3>
            <p className="text-gray-600 mb-4">
              Full billing management with Stripe integration will be available soon.
            </p>
            <p className="text-sm text-gray-500">
              Features: transactions, refunds, invoices, 45-day guarantee workflow, analytics
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
