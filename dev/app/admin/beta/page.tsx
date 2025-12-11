'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  MessageSquare,
  Target,
  Zap,
  RefreshCw,
  Download,
  Mail,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChecklistItem {
  id: string
  category: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  automated: boolean
  lastChecked?: string
  details?: string
}

interface BetaMetrics {
  users: {
    total: number
    betaUsers: number
    earlyAdopters: number
    new: number
    active: number
    onboarded: number
    onboardingRate: string
    targetProgress: string
  }
  toolUsage: {
    total: number
    completed: number
    failed: number
    uniqueUsers: number
    errorRate: string
    successRate: string
  }
  support: {
    totalTickets: number
    openTickets: number
    avgResponseTime: string
    slaWithin4h: string
  }
  feedback: {
    total: number
    byType: Record<string, number>
    avgRating: string
    surveyResponses: number
  }
  payments: {
    total: number
    failed: number
    failedRate: string
  }
  health: {
    status: 'healthy' | 'warning' | 'critical'
    errorRate: string
    uptime: string
  }
  dailyActivity: Array<{
    date: string
    signups: number
    toolRuns: number
    activeUsers: number
  }>
  topTools: Array<{
    toolId: string
    _count: number
    tool?: { id: string; name: string; slug: string }
  }>
}

export default function BetaDashboardPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [metrics, setMetrics] = useState<BetaMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [checklistRes, metricsRes] = await Promise.all([
        fetch('/api/admin/beta/checklist'),
        fetch('/api/admin/beta/metrics?period=7d'),
      ])

      if (checklistRes.ok) {
        const data = await checklistRes.json()
        setChecklist(data.checklist)
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch beta data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail) return
    setInviting(true)

    try {
      const response = await fetch('/api/admin/beta/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      })

      if (response.ok) {
        setInviteEmail('')
        setInviteName('')
        setInviteDialogOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
    } finally {
      setInviting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const completedItems = checklist.filter(item => item.status === 'completed').length
  const totalItems = checklist.length
  const readinessPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beta Launch Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Phase 9: Soft launch to 100 beta users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Beta User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Beta User</DialogTitle>
                <DialogDescription>
                  Send an invitation to join the Frith AI beta program.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <Button 
                  onClick={handleInviteUser} 
                  disabled={!inviteEmail || inviting}
                  className="w-full"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beta Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.users.betaUsers || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={parseFloat(metrics?.users.targetProgress || '0')} className="flex-1" />
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.users.earlyAdopters || 0} early adopters • {metrics?.users.new || 0} new this week
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
              {metrics?.toolUsage.successRate} success rate
            </p>
            <p className="text-xs text-green-600 mt-1">
              {metrics?.toolUsage.uniqueUsers || 0} unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.support.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.support.totalTickets || 0} total this week
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg response: {metrics?.support.avgResponseTime || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              SLA &lt; 4h: {metrics?.support.slaWithin4h || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className={`h-4 w-4 ${getHealthColor(metrics?.health.status || 'healthy')}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${getHealthColor(metrics?.health.status || 'healthy')}`}>
              {metrics?.health.status || 'Healthy'}
            </div>
            <p className="text-xs text-muted-foreground">
              Error rate: {metrics?.health.errorRate || '0%'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Uptime: {metrics?.health.uptime || '99.9%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklist">Pre-Launch Checklist</TabsTrigger>
          <TabsTrigger value="users">Beta Users</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Launch Readiness</CardTitle>
                  <CardDescription>
                    {completedItems} of {totalItems} items completed
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{readinessPercent.toFixed(0)}%</div>
                  <Badge variant={readinessPercent === 100 ? 'default' : 'secondary'}>
                    {readinessPercent === 100 ? 'Ready to Launch' : 'In Progress'}
                  </Badge>
                </div>
              </div>
              <Progress value={readinessPercent} className="mt-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['Infrastructure', 'Content', 'Testing', 'Monitoring', 'Legal', 'Beta Progress'].map(category => {
                  const categoryItems = checklist.filter(item => item.category === category)
                  if (categoryItems.length === 0) return null

                  return (
                    <div key={category}>
                      <h3 className="font-semibold mb-3">{category}</h3>
                      <div className="space-y-2">
                        {categoryItems.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {item.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : item.status === 'failed' ? (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                {item.details && (
                                  <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
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

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Beta User Statistics</CardTitle>
              <CardDescription>User engagement and onboarding metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{metrics?.users.active || 0}</p>
                  <p className="text-xs text-muted-foreground">Logged in this week</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Onboarded</p>
                  <p className="text-2xl font-bold">{metrics?.users.onboarded || 0}</p>
                  <p className="text-xs text-muted-foreground">{metrics?.users.onboardingRate}% completion</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">New This Week</p>
                  <p className="text-2xl font-bold">{metrics?.users.new || 0}</p>
                  <p className="text-xs text-muted-foreground">Signups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>Feedback collected during beta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold">{metrics?.feedback.total || 0}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold">{metrics?.feedback.avgRating || 'N/A'} / 5</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Survey Responses</p>
                  <p className="text-2xl font-bold">{metrics?.feedback.surveyResponses || 0}</p>
                </div>
              </div>
              {metrics?.feedback.byType && Object.keys(metrics.feedback.byType).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">By Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(metrics.feedback.byType).map(([type, count]) => (
                      <Badge key={type} variant="outline">
                        {type.replace('_', ' ')}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Tools</CardTitle>
              <CardDescription>Most used tools during beta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.topTools.slice(0, 5).map((item, index) => (
                  <div key={item.toolId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{item.tool?.name || item.toolId}</span>
                    </div>
                    <Badge variant="secondary">{item._count} runs</Badge>
                  </div>
                ))}
                {(!metrics?.topTools || metrics.topTools.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">No tool usage data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Payment flow health during beta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{metrics?.payments.total || 0}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{metrics?.payments.failed || 0}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Failure Rate</p>
                  <p className="text-2xl font-bold">{metrics?.payments.failedRate || '0.00%'} </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
