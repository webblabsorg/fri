'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Rocket, 
  Users, 
  Zap, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  RefreshCw,
  Play,
  Settings,
  FileText,
  Share2,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface LaunchSettings {
  betaBadgeRemoved: boolean
  openSignups: boolean
  launchDate: string | null
  launchAnnounced: boolean
  maintenanceMode: boolean
}

interface LaunchMetrics {
  users: {
    total: number
    new: number
    active: number
    free: number
    paid: number
    conversionRate: string
    day7Retention: string
  }
  toolUsage: {
    total: number
    completed: number
    failed: number
    uniqueUsers: number
    errorRate: string
    runsPerUser: string
  }
  revenue: {
    transactions: number
    successful: number
    total: number
    currency: string
  }
  support: {
    totalTickets: number
    openTickets: number
    avgResponseTime: string
    slaWithin4h: string
  }
  targets: Record<string, { target: number; current: number; met: boolean }>
  launchSuccess: boolean
  targetsMetCount: number
}

interface ChecklistItem {
  id: string
  category: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  automated: boolean
  priority: 'critical' | 'high' | 'medium' | 'low'
  details?: string
}

export default function LaunchDashboardPage() {
  const [settings, setSettings] = useState<LaunchSettings | null>(null)
  const [metrics, setMetrics] = useState<LaunchMetrics | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [checklistSummary, setChecklistSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, metricsRes, checklistRes] = await Promise.all([
        fetch('/api/admin/launch/controls'),
        fetch(`/api/admin/launch/metrics?period=${period}`),
        fetch('/api/admin/launch/checklist'),
      ])

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data)
      }

      if (checklistRes.ok) {
        const data = await checklistRes.json()
        setChecklist(data.checklist)
        setChecklistSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load launch data')
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: string) => {
    setActionLoading(action)
    try {
      const response = await fetch('/api/admin/launch/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        toast.success(`Action "${action}" completed successfully`)
        fetchData()
      } else {
        toast.error('Action failed')
      }
    } catch (error) {
      toast.error('Failed to execute action')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical</Badge>
      case 'high':
        return <Badge className="bg-orange-500 text-white">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>
      case 'low':
        return <Badge className="bg-gray-500 text-white">Low</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-blue-600" />
            Public Launch Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your public launch and monitor key metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Launch Status Banner */}
      <Card className={`mb-6 ${settings?.launchAnnounced ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {settings?.launchAnnounced ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <Clock className="h-8 w-8 text-yellow-600" />
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {settings?.launchAnnounced ? 'Platform is LIVE!' : 'Pre-Launch Mode'}
                </h3>
                <p className="text-sm text-gray-600">
                  {settings?.launchAnnounced 
                    ? `Launched on ${settings.launchDate ? new Date(settings.launchDate).toLocaleDateString() : 'N/A'}`
                    : 'Complete the checklist and go live when ready'}
                </p>
              </div>
            </div>
            {!settings?.launchAnnounced && (
              <Button 
                onClick={() => executeAction('go_live')}
                disabled={actionLoading === 'go_live' || checklistSummary?.criticalPending > 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === 'go_live' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Go Live
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Launch Controls */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Beta Badge</p>
                <p className="font-semibold">
                  {settings?.betaBadgeRemoved ? 'Removed' : 'Visible'}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => executeAction(settings?.betaBadgeRemoved ? 'restore_beta_badge' : 'remove_beta_badge')}
                disabled={actionLoading !== null}
              >
                {settings?.betaBadgeRemoved ? 'Restore' : 'Remove'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Public Signups</p>
                <p className="font-semibold">
                  {settings?.openSignups ? 'Open' : 'Invite Only'}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => executeAction(settings?.openSignups ? 'disable_open_signups' : 'enable_open_signups')}
                disabled={actionLoading !== null}
              >
                {settings?.openSignups ? 'Close' : 'Open'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Maintenance Mode</p>
                <p className="font-semibold">
                  {settings?.maintenanceMode ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Button 
                size="sm" 
                variant={settings?.maintenanceMode ? 'destructive' : 'outline'}
                onClick={() => executeAction(settings?.maintenanceMode ? 'disable_maintenance' : 'enable_maintenance')}
                disabled={actionLoading !== null}
              >
                {settings?.maintenanceMode ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Launch Targets</p>
                <p className="font-semibold">
                  {metrics?.targetsMetCount || 0} / 5 Met
                </p>
              </div>
              {metrics?.launchSuccess ? (
                <Badge className="bg-green-500 text-white">Success</Badge>
              ) : (
                <Badge className="bg-yellow-500 text-white">In Progress</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.users.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{metrics?.users.new || 0} new this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.users.conversionRate || '0%'}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.users.paid || 0} paid users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tool Runs</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.toolUsage.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.toolUsage.runsPerUser || 0} per user
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(metrics?.revenue.total || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.revenue.successful || 0} transactions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Error Rate</span>
                  <Badge className={parseFloat(metrics?.toolUsage.errorRate || '0') <= 1 ? 'bg-green-500' : 'bg-red-500'}>
                    {metrics?.toolUsage.errorRate || '0%'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Day 7 Retention</span>
                  <Badge className={parseFloat(metrics?.users.day7Retention || '0') >= 40 ? 'bg-green-500' : 'bg-yellow-500'}>
                    {metrics?.users.day7Retention || '0%'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-medium">{metrics?.support.avgResponseTime || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SLA &lt;4h Compliance</span>
                  <Badge className={
                    parseFloat(metrics?.support.slaWithin4h || '0') >= 90 
                      ? 'bg-green-500' 
                      : parseFloat(metrics?.support.slaWithin4h || '0') >= 70 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }>
                    {metrics?.support.slaWithin4h || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Open Tickets</span>
                  <span className="font-medium">{metrics?.support.openTickets || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/admin/launch/blog">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Blog Posts
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/admin/launch/social">
                    <Share2 className="h-4 w-4 mr-2" />
                    Social Media Posts
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/admin/launch/waitlist">
                    <Mail className="h-4 w-4 mr-2" />
                    Waitlist Management
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/admin/support">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Support Tickets
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Launch Checklist</CardTitle>
                  <CardDescription>
                    {checklistSummary?.completed || 0} of {checklistSummary?.total || 0} items completed
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Progress 
                    value={checklistSummary ? (checklistSummary.completed / checklistSummary.total) * 100 : 0} 
                    className="w-32"
                  />
                  {checklistSummary?.criticalPending > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {checklistSummary.criticalPending} critical items pending
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['scaling', 'monitoring', 'infrastructure', 'marketing', 'team', 'content'].map(category => {
                  const items = checklist.filter(item => item.category === category)
                  if (items.length === 0) return null

                  return (
                    <div key={category}>
                      <h4 className="font-semibold capitalize mb-2">{category}</h4>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {item.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : item.status === 'failed' ? (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-500" />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                {item.details && (
                                  <p className="text-xs text-gray-500 mt-1">{item.details}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(item.priority)}
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Launch Week Targets
              </CardTitle>
              <CardDescription>
                Track progress toward key launch metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics?.targets && Object.entries(metrics.targets).map(([key, target]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {target.current.toFixed(1)} / {target.target}
                        </span>
                        {target.met ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={Math.min((target.current / target.target) * 100, 100)} 
                      className={target.met ? 'bg-green-100' : ''}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Blog Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Create and schedule launch announcement and follow-up posts.
                </p>
                <Button asChild>
                  <a href="/admin/launch/blog">Manage Posts</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Schedule Twitter, LinkedIn, and Facebook posts.
                </p>
                <Button asChild>
                  <a href="/admin/launch/social">Manage Social</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Waitlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage waitlist subscribers and send launch emails.
                </p>
                <Button asChild>
                  <a href="/admin/launch/waitlist">Manage Waitlist</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
