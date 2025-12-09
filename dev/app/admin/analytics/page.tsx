'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, DollarSign, Activity, Download } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface AnalyticsData {
  userMetrics: {
    dau: number
    mau: number
    totalUsers: number
    freeUsers: number
    paidUsers: number
    conversionRate: number
    churnRate: number
    userGrowth: Array<{ date: string; count: number }>
  }
  engagementMetrics: {
    totalRuns: number
    avgRunsPerUser: number
    activeUsers: number
    toolUsage: Array<{ tool: string; runs: number }>
  }
  revenueMetrics: {
    totalRevenue: number
    mrr: number
    arr: number
    arpu: number
    revenueByTier: Array<{ tier: string; amount: number }>
    dailyRevenue: Array<{ date: string; amount: number }>
  }
  technicalMetrics: {
    totalRuns: number
    failedRuns: number
    errorRate: number
    avgResponseTime: number
    uptime: number
  }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics/advanced?days=${days}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!data) return

    const csv = [
      ['Metric', 'Value'],
      ['DAU', data.userMetrics.dau],
      ['MAU', data.userMetrics.mau],
      ['Total Users', data.userMetrics.totalUsers],
      ['Paid Users', data.userMetrics.paidUsers],
      ['Conversion Rate', `${data.userMetrics.conversionRate}%`],
      ['MRR', `$${data.revenueMetrics.mrr}`],
      ['ARR', `$${data.revenueMetrics.arr}`],
      ['ARPU', `$${data.revenueMetrics.arpu}`],
      ['Total Revenue', `$${data.revenueMetrics.totalRevenue}`],
      ['Error Rate', `${data.technicalMetrics.errorRate}%`],
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString()}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div>Failed to load analytics data</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
          <p className="text-gray-600">
            Detailed metrics and insights for platform performance
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-md"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              DAU / MAU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.userMetrics.dau} / {data.userMetrics.mau}</p>
            <p className="text-sm text-gray-600 mt-1">
              {data.userMetrics.mau > 0 
                ? `${Math.round((data.userMetrics.dau / data.userMetrics.mau) * 100)}% DAU/MAU`
                : 'No active users'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.userMetrics.conversionRate}%</p>
            <p className="text-sm text-gray-600 mt-1">
              {data.userMetrics.paidUsers} / {data.userMetrics.totalUsers} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              MRR / ARR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${data.revenueMetrics.mrr.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">
              ${data.revenueMetrics.arr.toLocaleString()} ARR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.technicalMetrics.uptime.toFixed(2)}%</p>
            <p className="text-sm text-gray-600 mt-1">
              {data.technicalMetrics.errorRate.toFixed(2)}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.userMetrics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue & Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueMetrics.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#10b981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenueMetrics.revenueByTier}
                  dataKey="amount"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.revenueMetrics.revenueByTier.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tool Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Top Tools by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.engagementMetrics.toolUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="tool" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="runs" fill="#8b5cf6" name="Runs" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">${data.revenueMetrics.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MRR</span>
              <span className="font-semibold">${data.revenueMetrics.mrr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ARR</span>
              <span className="font-semibold">${data.revenueMetrics.arr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ARPU</span>
              <span className="font-semibold">${data.revenueMetrics.arpu.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold">{data.userMetrics.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Free Users</span>
              <span className="font-semibold">{data.userMetrics.freeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Users</span>
              <span className="font-semibold">{data.userMetrics.paidUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Churn Rate</span>
              <span className="font-semibold">{data.userMetrics.churnRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Runs</span>
              <span className="font-semibold">{data.engagementMetrics.totalRuns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold">{data.engagementMetrics.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Runs/User</span>
              <span className="font-semibold">{data.engagementMetrics.avgRunsPerUser}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate</span>
              <span className="font-semibold">{data.technicalMetrics.errorRate.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
