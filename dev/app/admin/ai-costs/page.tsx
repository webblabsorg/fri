'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Activity, Cpu, RefreshCw } from 'lucide-react'

interface AICostData {
  summary: {
    totalCost: number
    totalTokens: number
    totalRuns: number
    averageCostPerRun: number
    dateRange: {
      from: string
      to: string
      days: number
    }
  }
  costByModel: Array<{
    model: string
    cost: number
    tokens: number
    runs: number
  }>
  costByTier: Array<{
    tier: string
    cost: number
    tokens: number
    runs: number
  }>
  costByTool: Array<{
    toolId: string
    toolName: string
    cost: number
    tokens: number
    runs: number
  }>
  topUsers: Array<{
    userId: string
    userName: string
    userEmail: string
    tier: string
    cost: number
    tokens: number
    runs: number
  }>
  dailyCosts: Array<{
    date: string
    cost: number
    tokens: number
    runs: number
  }>
  marginByTier: Array<{
    tier: string
    revenue: number
    cost: number
    runs: number
    costPerRun: number
    margin: number
    marginPercent: number
  }>
}

export default function AICoPage() {
  const [data, setData] = useState<AICostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAICosts()
  }, [days])

  const fetchAICosts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics/ai-costs?days=${days}`)
      if (response.ok) {
        const costData = await response.json()
        setData(costData)
      }
    } catch (error) {
      console.error('Failed to fetch AI costs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">AI Cost Monitoring</h1>
        </div>
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading AI cost data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">AI Cost Monitoring</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No AI cost data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Cost Monitoring</h1>
          <p className="text-gray-600">
            Track AI spend by model, tier, user, and tool
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button onClick={fetchAICosts} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total AI Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-red-600" />
              <p className="text-3xl font-bold">
                ${data.summary.totalCost.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Last {data.summary.dateRange.days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <p className="text-3xl font-bold">
                {(data.summary.totalTokens / 1000000).toFixed(2)}M
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {data.summary.totalRuns.toLocaleString()} runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Cost Per Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-3xl font-bold">
                ${data.summary.averageCostPerRun.toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Models Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-purple-600" />
              <p className="text-3xl font-bold">{data.costByModel.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by AI Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.costByModel.map((item) => (
              <div key={item.model} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-semibold">{item.model}</p>
                  <p className="text-sm text-gray-600">
                    {item.runs.toLocaleString()} runs • {(item.tokens / 1000000).toFixed(2)}M tokens
                  </p>
                </div>
                <p className="text-lg font-bold">${item.cost.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost by Tier & Margin Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Subscription Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.costByTier.map((item) => (
                <div key={item.tier} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-semibold capitalize">{item.tier}</p>
                    <p className="text-sm text-gray-600">
                      {item.runs.toLocaleString()} runs
                    </p>
                  </div>
                  <p className="text-lg font-bold">${item.cost.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Margin Analysis by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.marginByTier.map((item) => (
                <div key={item.tier} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold capitalize">{item.tier}</p>
                    <p className={`text-sm font-bold ${
                      item.marginPercent > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.marginPercent.toFixed(1)}% margin
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Revenue: ${item.revenue.toFixed(2)} • Cost/run: ${item.costPerRun.toFixed(4)}</p>
                    <p>Runs: {item.runs.toLocaleString()} • Total cost: ${item.cost.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Most Expensive Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Most Expensive Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Tool</th>
                  <th className="text-right p-3 font-semibold">Runs</th>
                  <th className="text-right p-3 font-semibold">Tokens</th>
                  <th className="text-right p-3 font-semibold">Total Cost</th>
                  <th className="text-right p-3 font-semibold">Cost/Run</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.costByTool.map((item) => (
                  <tr key={item.toolId} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.toolName}</td>
                    <td className="p-3 text-right">{item.runs.toLocaleString()}</td>
                    <td className="p-3 text-right">{(item.tokens / 1000).toFixed(1)}K</td>
                    <td className="p-3 text-right font-bold">${item.cost.toFixed(2)}</td>
                    <td className="p-3 text-right text-sm text-gray-600">
                      ${(item.cost / item.runs).toFixed(4)}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/tools'}
                        className="text-xs"
                      >
                        View in Tools
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Users by Cost */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Users by AI Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">User</th>
                  <th className="text-left p-3 font-semibold">Tier</th>
                  <th className="text-right p-3 font-semibold">Runs</th>
                  <th className="text-right p-3 font-semibold">Tokens</th>
                  <th className="text-right p-3 font-semibold">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.topUsers.map((user) => (
                  <tr key={user.userId} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium">{user.userName}</p>
                      <p className="text-xs text-gray-600">{user.userEmail}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 capitalize">
                        {user.tier}
                      </span>
                    </td>
                    <td className="p-3 text-right">{user.runs.toLocaleString()}</td>
                    <td className="p-3 text-right">{(user.tokens / 1000).toFixed(1)}K</td>
                    <td className="p-3 text-right font-bold">${user.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Daily Cost Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cost Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.dailyCosts.slice(-14).map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <p className="text-sm text-gray-600 w-24">{day.date}</p>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.min((day.cost / Math.max(...data.dailyCosts.map(d => d.cost))) * 100, 100)}%`
                    }}
                  >
                    <span className="text-xs text-white font-semibold">
                      ${day.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 w-20 text-right">
                  {day.runs} runs
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
