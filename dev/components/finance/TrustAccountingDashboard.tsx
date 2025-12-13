'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingDown, 
  Shield, 
  FileText, 
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Building2,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'

interface TrustAlert {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  entityName: string
  detectedAt: string
  suggestedAction?: string
}

interface RiskScore {
  trustAccountId: string
  accountName: string
  overallScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
}

interface PredictiveBalance {
  clientLedgerId: string
  clientName: string
  currentBalance: number
  daysUntilDepletion: number | null
  burnRate: number
  recommendation: string
}

interface FeeSuggestion {
  clientLedgerId: string
  clientName: string
  currentBalance: number
  suggestedTransferAmount: number
  confidence: number
  reason: string
}

interface DashboardData {
  alerts: TrustAlert[]
  riskScores: RiskScore[]
  predictions: PredictiveBalance[]
  feeSuggestions: FeeSuggestion[]
  summary: {
    totalTrustBalance: number
    totalAlerts: number
    criticalAlerts: number
    averageRiskScore: number
    urgentDepletions: number
  }
}

export default function TrustAccountingDashboard({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'predictions' | 'compliance'>('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [organizationId])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [alertsRes, riskRes, predictionsRes, suggestionsRes] = await Promise.all([
        fetch(`/api/trust/ai/alerts?organizationId=${organizationId}`),
        fetch(`/api/trust/ai/risk-score?organizationId=${organizationId}`),
        fetch(`/api/trust/ai/predictive-balance?organizationId=${organizationId}`),
        fetch(`/api/trust/ai/fee-transfer-suggestions?organizationId=${organizationId}`),
      ])

      const [alertsData, riskData, predictionsData, suggestionsData] = await Promise.all([
        alertsRes.json(),
        riskRes.json(),
        predictionsRes.json(),
        suggestionsRes.json(),
      ])

      setData({
        alerts: alertsData.alerts || [],
        riskScores: riskData.scores || [],
        predictions: predictionsData.predictions || [],
        feeSuggestions: suggestionsData.suggestions || [],
        summary: {
          totalTrustBalance: predictionsData.summary?.totalCurrentBalance || 0,
          totalAlerts: alertsData.summary?.total || 0,
          criticalAlerts: alertsData.summary?.critical || 0,
          averageRiskScore: riskData.summary?.averageScore || 0,
          urgentDepletions: predictionsData.summary?.urgentDepletion || 0,
        },
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading trust accounting data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Trust Accounting</h1>
            <p className="text-gray-400 mt-1">IOLTA Compliance & AI Monitoring</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-gray-400 text-sm">Total Trust Balance</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data?.summary.totalTrustBalance || 0)}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-gray-400 text-sm">Critical Alerts</span>
            </div>
            <p className="text-2xl font-bold">{data?.summary.criticalAlerts || 0}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400 text-sm">Avg Risk Score</span>
            </div>
            <p className="text-2xl font-bold">{data?.summary.averageRiskScore || 0}/100</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <span className="text-gray-400 text-sm">Urgent Depletions</span>
            </div>
            <p className="text-2xl font-bold">{data?.summary.urgentDepletions || 0}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">Total Alerts</span>
            </div>
            <p className="text-2xl font-bold">{data?.summary.totalAlerts || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'predictions', label: 'Predictions', icon: TrendingDown },
            { id: 'compliance', label: 'Compliance', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recent Alerts
              </h2>
              <div className="space-y-3">
                {data?.alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                      </div>
                      <span className="text-xs uppercase font-bold">{alert.severity}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500">No alerts</p>
                )}
              </div>
            </div>

            {/* Fee Transfer Suggestions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Smart Fee Transfer Suggestions
              </h2>
              <div className="space-y-3">
                {data?.feeSuggestions.slice(0, 5).map((suggestion) => (
                  <div
                    key={suggestion.clientLedgerId}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{suggestion.clientName}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Transfer {formatCurrency(suggestion.suggestedTransferAmount)} to operating
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                      </div>
                      <span className="text-sm text-green-500">{suggestion.confidence}% confidence</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500">No suggestions</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">All Trust Alerts</h2>
            <div className="space-y-3">
              {data?.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold px-2 py-1 rounded bg-black/20">
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-400">{alert.type}</span>
                      </div>
                      <p className="font-medium mt-2">{alert.title}</p>
                      <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                      {alert.suggestedAction && (
                        <p className="text-sm mt-2 p-2 bg-black/20 rounded">
                          <strong>Suggested Action:</strong> {alert.suggestedAction}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50" />
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No alerts to display</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Predictive Trust Balances</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Client</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Current Balance</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Daily Burn Rate</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Days Until Depletion</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.predictions.map((prediction) => (
                    <tr key={prediction.clientLedgerId} className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium">{prediction.clientName}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(prediction.currentBalance)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(prediction.burnRate)}/day</td>
                      <td className="py-3 px-4 text-right">
                        {prediction.daysUntilDepletion !== null ? (
                          <span className={prediction.daysUntilDepletion <= 14 ? 'text-red-500 font-bold' : prediction.daysUntilDepletion <= 30 ? 'text-yellow-500' : ''}>
                            {prediction.daysUntilDepletion} days
                          </span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">{prediction.recommendation}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">No predictions available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Compliance Risk Scores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.riskScores.map((score) => (
                  <div
                    key={score.trustAccountId}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{score.accountName}</h3>
                      <span className={`text-2xl font-bold ${getRiskColor(score.riskLevel)}`}>
                        {score.overallScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            score.riskLevel === 'low' ? 'bg-green-500' :
                            score.riskLevel === 'medium' ? 'bg-yellow-500' :
                            score.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score.overallScore}%` }}
                        />
                      </div>
                      <span className={`text-xs uppercase font-bold ${getRiskColor(score.riskLevel)}`}>
                        {score.riskLevel}
                      </span>
                    </div>
                    {score.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Recommendations:</p>
                        <ul className="text-sm space-y-1">
                          {score.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="text-gray-300 flex items-start gap-2">
                              <span className="text-gray-500">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500 col-span-full text-center py-8">No risk scores available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
