'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

interface FinancialDashboardProps {
  organizationId: string
}

interface CashFlowForecast {
  summary: {
    totalProjectedInflow: number
    totalProjectedOutflow: number
    netCashFlow: number
    endingCashBalance: number
    confidenceScore: number
  }
  periods: Array<{
    periodStart: string
    periodEnd: string
    projectedInflows: { total: number }
    projectedOutflows: { total: number }
    netCashFlow: number
    runningBalance: number
  }>
  alerts: Array<{
    type: string
    severity: string
    message: string
    amount?: number
  }>
}

interface AnomalyResult {
  anomalies: Array<{
    id: string
    transactionType: string
    anomalyType: string
    severity: string
    description: string
    amount: number
    confidence: number
  }>
  summary: {
    total: number
    bySeverity: { low: number; medium: number; high: number; critical: number }
  }
}

interface TrialBalance {
  asOfDate: string
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  accounts: Array<{
    accountId: string
    accountNumber: string
    accountName: string
    accountType: string
    balance: number
  }>
}

export default function FinancialDashboard({ organizationId }: FinancialDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowForecast | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyResult | null>(null)
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [organizationId])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [forecastRes, anomalyRes, trialBalanceRes] = await Promise.all([
        fetch(`/api/finance/ai/cash-flow-forecast?organizationId=${organizationId}`),
        fetch(`/api/finance/ai/anomaly-detection?organizationId=${organizationId}`),
        fetch(`/api/finance/trial-balance?organizationId=${organizationId}`),
      ])

      if (forecastRes.ok) {
        setCashFlowForecast(await forecastRes.json())
      }
      if (anomalyRes.ok) {
        setAnomalies(await anomalyRes.json())
      }
      if (trialBalanceRes.ok) {
        setTrialBalance(await trialBalanceRes.json())
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading financial dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Financial Dashboard</h1>
            <p className="text-sm text-white/60 mt-1">
              AI-powered financial insights and monitoring
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/60">Projected Cash Balance</span>
            </div>
            <div className="text-3xl font-semibold text-white">
              ${cashFlowForecast?.summary.endingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
            </div>
            <div className="text-sm text-white/50 mt-1">3-month forecast</div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/60">Projected Inflows</span>
            </div>
            <div className="text-3xl font-semibold text-white">
              ${cashFlowForecast?.summary.totalProjectedInflow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
            </div>
            <div className="text-sm text-white/50 mt-1">Next 90 days</div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/60">Projected Outflows</span>
            </div>
            <div className="text-3xl font-semibold text-white">
              ${cashFlowForecast?.summary.totalProjectedOutflow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
            </div>
            <div className="text-sm text-white/50 mt-1">Next 90 days</div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                {trialBalance?.isBalanced ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-sm text-white/60">Books Status</span>
            </div>
            <div className="text-3xl font-semibold text-white">
              {trialBalance?.isBalanced ? 'Balanced' : 'Review'}
            </div>
            <div className="text-sm text-white/50 mt-1">
              {trialBalance?.accounts.length || 0} accounts
            </div>
          </div>
        </div>

        {/* Middle Row - Charts and Forecast */}
        <div className="grid grid-cols-3 gap-6">
          {/* Cash Flow Chart */}
          <div className="col-span-2 p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-white/60" />
                <h2 className="text-lg font-semibold text-white">Cash Flow Forecast</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Sparkles className="w-4 h-4" />
                <span>{cashFlowForecast?.summary.confidenceScore || 0}% confidence</span>
              </div>
            </div>

            {/* Simple Bar Chart Visualization */}
            <div className="h-48 flex items-end gap-2">
              {cashFlowForecast?.periods.slice(0, 12).map((period, idx) => {
                const maxValue = Math.max(
                  ...cashFlowForecast.periods.map((p) =>
                    Math.max(p.projectedInflows.total, p.projectedOutflows.total)
                  )
                )
                const inflowHeight = (period.projectedInflows.total / maxValue) * 100
                const outflowHeight = (period.projectedOutflows.total / maxValue) * 100

                return (
                  <div key={idx} className="flex-1 flex gap-1 items-end">
                    <div
                      className="flex-1 bg-white/30 rounded-t"
                      style={{ height: `${inflowHeight}%` }}
                      title={`Inflow: $${period.projectedInflows.total.toLocaleString()}`}
                    />
                    <div
                      className="flex-1 bg-white/10 rounded-t"
                      style={{ height: `${outflowHeight}%` }}
                      title={`Outflow: $${period.projectedOutflows.total.toLocaleString()}`}
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white/30 rounded" />
                <span className="text-white/60">Inflows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white/10 rounded" />
                <span className="text-white/60">Outflows</span>
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-white/60" />
              <h2 className="text-lg font-semibold text-white">Cash Flow Alerts</h2>
            </div>

            <div className="space-y-3">
              {cashFlowForecast?.alerts.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No alerts at this time</p>
                </div>
              ) : (
                cashFlowForecast?.alerts.slice(0, 5).map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'critical'
                        ? 'bg-white/10 border-white/30'
                        : alert.severity === 'warning'
                        ? 'bg-white/5 border-white/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 ${
                          alert.severity === 'critical'
                            ? 'text-white'
                            : 'text-white/60'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-white">{alert.message}</p>
                        {alert.amount && (
                          <p className="text-xs text-white/50 mt-1">
                            Amount: ${Math.abs(alert.amount).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row - Anomalies and Account Summary */}
        <div className="grid grid-cols-2 gap-6">
          {/* Anomaly Detection */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-white/60" />
                <h2 className="text-lg font-semibold text-white">AI Anomaly Detection</h2>
              </div>
              <span className="text-sm text-white/50">
                {anomalies?.summary.total || 0} detected
              </span>
            </div>

            {/* Severity Summary */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-2xl font-semibold text-white">
                  {anomalies?.summary.bySeverity.critical || 0}
                </div>
                <div className="text-xs text-white/50">Critical</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-2xl font-semibold text-white">
                  {anomalies?.summary.bySeverity.high || 0}
                </div>
                <div className="text-xs text-white/50">High</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-2xl font-semibold text-white">
                  {anomalies?.summary.bySeverity.medium || 0}
                </div>
                <div className="text-xs text-white/50">Medium</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-2xl font-semibold text-white">
                  {anomalies?.summary.bySeverity.low || 0}
                </div>
                <div className="text-xs text-white/50">Low</div>
              </div>
            </div>

            {/* Recent Anomalies */}
            <div className="space-y-2">
              {anomalies?.anomalies.slice(0, 4).map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{anomaly.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/50">{anomaly.transactionType}</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-white/50">{anomaly.anomalyType}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-mono text-white">
                      ${anomaly.amount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${
                      anomaly.severity === 'critical' ? 'text-white' :
                      anomaly.severity === 'high' ? 'text-white/80' :
                      'text-white/50'
                    }`}>
                      {anomaly.severity}
                    </div>
                  </div>
                </div>
              ))}

              {(!anomalies || anomalies.anomalies.length === 0) && (
                <div className="text-center py-8 text-white/40">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No anomalies detected</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Balances */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-white/60" />
                <h2 className="text-lg font-semibold text-white">Account Balances</h2>
              </div>
              <span className="text-sm text-white/50">
                As of {trialBalance?.asOfDate ? new Date(trialBalance.asOfDate).toLocaleDateString() : 'today'}
              </span>
            </div>

            {/* Account Type Summary */}
            <div className="space-y-3">
              {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
                const typeAccounts = trialBalance?.accounts.filter((a) => a.accountType === type) || []
                const totalBalance = typeAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0)

                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white capitalize">{type}</span>
                      <span className="text-xs text-white/40">
                        ({typeAccounts.length} accounts)
                      </span>
                    </div>
                    <span className="font-mono text-white">
                      ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Balance Check */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Trial Balance Status</span>
                <div className="flex items-center gap-2">
                  {trialBalance?.isBalanced ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span className="text-white">Balanced</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-white/60" />
                      <span className="text-white/60">
                        Off by ${Math.abs((trialBalance?.totalDebit || 0) - (trialBalance?.totalCredit || 0)).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-white/50">Total Debits</span>
                  <div className="font-mono text-white">
                    ${(trialBalance?.totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-white/50">Total Credits</span>
                  <div className="font-mono text-white">
                    ${(trialBalance?.totalCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
