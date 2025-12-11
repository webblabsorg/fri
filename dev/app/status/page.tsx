'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, XCircle, Activity, Calendar } from 'lucide-react'

interface Incident {
  id: string
  title: string
  description: string
  status: string
  severity: string
  affectedServices: string[]
  startedAt: string
  resolvedAt: string | null
  updates: any
}

interface MaintenanceWindow {
  id: string
  title: string
  description: string
  scheduledStart: string
  scheduledEnd: string
  affectedServices: string[]
  status: string
}

interface StatusData {
  currentStatus: 'operational' | 'degraded' | 'partial_outage' | 'major_outage'
  incidents: Incident[]
  maintenance: MaintenanceWindow[]
}

export default function StatusPage() {
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    
    // Poll every 60 seconds
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status/incidents')
      const data = await response.json()
      setStatusData(data)
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'degraded':
      case 'partial_outage':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />
      case 'major_outage':
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <Activity className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, { title: string; description: string; color: string }> = {
      operational: {
        title: 'All Systems Operational',
        description: 'All services are running normally',
        color: 'text-green-600 dark:text-green-400',
      },
      degraded: {
        title: 'Degraded Performance',
        description: 'Some services may be experiencing slower response times',
        color: 'text-yellow-600 dark:text-yellow-400',
      },
      partial_outage: {
        title: 'Partial Outage',
        description: 'Some services are experiencing issues',
        color: 'text-orange-600 dark:text-orange-400',
      },
      major_outage: {
        title: 'Major Outage',
        description: 'Multiple services are unavailable',
        color: 'text-red-600 dark:text-red-400',
      },
    }

    return texts[status] || texts.operational
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      minor: 'secondary',
      major: 'default',
      critical: 'destructive',
    }

    return (
      <Badge variant={variants[severity] || 'default'}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    )
  }

  const getIncidentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      investigating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      identified: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      monitoring: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[status] || colors.investigating}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const services = [
    { name: 'Web Application', key: 'web' },
    { name: 'API', key: 'api' },
    { name: 'Dashboard', key: 'dashboard' },
    { name: 'Database', key: 'database' },
    { name: 'AI Processing', key: 'ai' },
    { name: 'Email Service', key: 'email' },
    { name: 'Payment Processing', key: 'payments' },
    { name: 'File Storage', key: 'storage' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading status...</p>
        </div>
      </div>
    )
  }

  const status = statusData?.currentStatus || 'operational'
  const statusInfo = getStatusText(status)
  const activeIncidents = statusData?.incidents?.filter(i => i.status !== 'resolved') || []
  const resolvedIncidents = statusData?.incidents?.filter(i => i.status === 'resolved').slice(0, 5) || []
  const upcomingMaintenance = statusData?.maintenance?.filter(m => m.status !== 'completed') || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Frith AI System Status</h1>
              <p className="text-muted-foreground mt-1">Real-time system status and incident reports</p>
            </div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Current Status Banner */}
      <section className={`py-12 ${status === 'operational' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            {getStatusIcon(status)}
            <h2 className={`text-3xl font-bold ${statusInfo.color}`}>
              {statusInfo.title}
            </h2>
          </div>
          <p className="text-center text-muted-foreground">
            {statusInfo.description}
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Active Incidents</h2>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <Card key={incident.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getSeverityBadge(incident.severity)}
                          {getIncidentStatusBadge(incident.status)}
                        </div>
                        <CardTitle className="text-lg">{incident.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Started {new Date(incident.startedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{incident.description}</p>
                    {incident.affectedServices && incident.affectedServices.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Affected services: {incident.affectedServices.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Maintenance */}
        {upcomingMaintenance.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Scheduled Maintenance
            </h2>
            <div className="space-y-4">
              {upcomingMaintenance.map((maintenance) => (
                <Card key={maintenance.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{maintenance.status}</Badge>
                    </div>
                    <CardTitle className="text-lg">{maintenance.title}</CardTitle>
                    <CardDescription>
                      {new Date(maintenance.scheduledStart).toLocaleString()} -{' '}
                      {new Date(maintenance.scheduledEnd).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{maintenance.description}</p>
                    {maintenance.affectedServices && maintenance.affectedServices.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Affected services: {maintenance.affectedServices.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Service Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Service Components</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {services.map((service) => (
                  <div key={service.key} className="flex items-center justify-between p-4">
                    <span className="font-medium">{service.name}</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Incidents */}
        {resolvedIncidents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Recent Incidents (Last 30 Days)</h2>
            <div className="space-y-4">
              {resolvedIncidents.map((incident) => (
                <Card key={incident.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getSeverityBadge(incident.severity)}
                          <Badge variant="outline">Resolved</Badge>
                        </div>
                        <CardTitle className="text-base">{incident.title}</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {new Date(incident.startedAt).toLocaleDateString()} -{' '}
                          {incident.resolvedAt && new Date(incident.resolvedAt).toLocaleDateString()}
                          {incident.resolvedAt && (
                            <span className="ml-2">
                              (Duration: {Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()) / 60000)} min)
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* No Incidents */}
        {activeIncidents.length === 0 && resolvedIncidents.length === 0 && (
          <Card className="mb-12">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">No Incidents Reported</h3>
              <p className="text-muted-foreground">
                All systems have been running smoothly. No incidents in the last 30 days. 🎉
              </p>
            </CardContent>
          </Card>
        )}

        {/* Subscribe Section */}
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Get Status Updates</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to receive notifications about system status updates and maintenance windows.
            </p>
            <p className="text-sm text-muted-foreground">
              Email notifications coming soon. For now, bookmark this page or check back regularly.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Frith AI. All rights reserved.</p>
          <div className="flex gap-4 justify-center mt-4">
            <Link href="/help" className="hover:text-foreground">Help Center</Link>
            <Link href="/support/submit-ticket" className="hover:text-foreground">Support</Link>
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
