'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, Users, CheckCircle, XCircle, Clock, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface InvitationData {
  id: string
  email: string
  role: string
  organization: {
    id: string
    name: string
    type: string
  }
  inviter: {
    name: string
    email: string
  }
  expiresAt: string
}

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.token) {
      fetchInvitation()
    }
  }, [params.token])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${params.token}`)
      if (response.ok) {
        const data = await response.json()
        setInvitation(data.invitation)
      } else {
        const error = await response.json()
        setError(error.error || 'Invalid invitation')
      }
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!invitation || !session) return

    setAccepting(true)
    try {
      const response = await fetch(`/api/invitations/${params.token}`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Welcome to ${data.organization.name}!`)
        router.push('/dashboard/organization')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to accept invitation')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'law_firm': return 'Law Firm'
      case 'corporate': return 'Corporate'
      case 'solo': return 'Solo Practice'
      case 'consultant': return 'Legal Consultant'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invalid Invitation</h3>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invitation Not Found</h3>
            <p className="text-gray-600 text-center mb-4">
              This invitation may have expired or been revoked.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is signed in and email matches
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-gray-600 text-center mb-4">
              Please sign in with the email address that received this invitation.
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if ((session.user as any)?.email !== invitation.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Email Mismatch</h3>
            <p className="text-gray-600 text-center mb-4">
              This invitation was sent to {invitation.email}, but you're signed in as {(session.user as any)?.email}.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/auth/signin')}>
                Sign In with Different Account
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invitation Expired</h3>
            <p className="text-gray-600 text-center mb-4">
              This invitation expired on {new Date(invitation.expiresAt).toLocaleDateString()}.
              Please contact {invitation.inviter.name} for a new invitation.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            {invitation.inviter.name} has invited you to join their organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{invitation.organization.name}</h3>
              <Badge variant="secondary">
                {getOrgTypeLabel(invitation.organization.type)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>You'll be joining as a</span>
              <Badge className={getRoleBadgeColor(invitation.role)}>
                {invitation.role}
              </Badge>
            </div>
          </div>

          {/* Inviter Info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-medium">
                {invitation.inviter.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="font-medium">{invitation.inviter.name}</p>
              <p className="text-sm text-gray-600">{invitation.inviter.email}</p>
            </div>
          </div>

          {/* Role Description */}
          <div className="text-sm text-gray-600">
            <h4 className="font-medium mb-2">As a {invitation.role}, you'll be able to:</h4>
            <ul className="space-y-1">
              {invitation.role === 'owner' && (
                <>
                  <li>• Full access to all organization features</li>
                  <li>• Manage billing and subscription</li>
                  <li>• Add and remove members</li>
                  <li>• Create and manage workspaces</li>
                </>
              )}
              {invitation.role === 'admin' && (
                <>
                  <li>• Manage organization members</li>
                  <li>• Create and manage workspaces</li>
                  <li>• Access all tools and projects</li>
                </>
              )}
              {invitation.role === 'member' && (
                <>
                  <li>• Access shared workspaces</li>
                  <li>• Create and run AI tools</li>
                  <li>• Collaborate on projects</li>
                </>
              )}
              {invitation.role === 'viewer' && (
                <>
                  <li>• View shared content</li>
                  <li>• Access read-only workspaces</li>
                  <li>• Limited tool access</li>
                </>
              )}
            </ul>
          </div>

          {/* Expiration Notice */}
          <div className="text-xs text-gray-500 text-center">
            This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={acceptInvitation}
              disabled={accepting}
              className="flex-1"
            >
              {accepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
