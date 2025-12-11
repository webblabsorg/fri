'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, UserPlus, Settings, Building, Crown, Shield, User, Eye, Mail, Calendar, MoreVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  type: string
  description?: string
  role: string
  memberCount: number
  workspaceCount: number
  createdAt: string
}

interface Member {
  id: string
  role: string
  status: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    image?: string
    createdAt: string
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  expiresAt: string
  inviter: {
    name: string
    email: string
  }
}

export default function OrganizationPage() {
  const { data: session } = useSession()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgType, setNewOrgType] = useState('law_firm')
  const [newOrgDescription, setNewOrgDescription] = useState('')

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchMembers()
    }
  }, [selectedOrg])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations)
        if (data.organizations.length > 0 && !selectedOrg) {
          setSelectedOrg(data.organizations[0])
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    }
  }

  const createOrganization = async () => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgName,
          type: newOrgType,
          description: newOrgDescription
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations([...organizations, data.organization])
        setSelectedOrg(data.organization)
        setShowCreateModal(false)
        setNewOrgName('')
        setNewOrgType('law_firm')
        setNewOrgDescription('')
        toast.success('Organization created successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization')
    }
  }

  const inviteMember = async () => {
    if (!selectedOrg || !inviteEmail) return

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        toast.success('Invitation sent successfully')
        setInviteEmail('')
        setInviteRole('member')
        setShowInviteModal(false)
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Failed to send invitation')
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          role: newRole,
          action: 'updateRole'
        })
      })

      if (response.ok) {
        toast.success('Member role updated')
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Failed to update role')
    }
  }

  const removeMember = async (memberId: string) => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          action: 'remove'
        })
      })

      if (response.ok) {
        toast.success('Member removed')
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />
      case 'member': return <User className="w-4 h-4 text-gray-500" />
      case 'viewer': return <Eye className="w-4 h-4 text-gray-400" />
      default: return <User className="w-4 h-4 text-gray-500" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-gray-600">Manage your organizations, members, and settings</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Building className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organizations</h3>
            <p className="text-gray-600 mb-4">Create your first organization to get started</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Building className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Organization Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Organizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedOrg?.id === org.id
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedOrg(org)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{org.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleIcon(org.role)}
                          <Badge className={getRoleBadgeColor(org.role)}>
                            {org.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{org.memberCount} members</span>
                      <span>{org.workspaceCount} workspaces</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Organization Details */}
          <div className="lg:col-span-3">
            {selectedOrg && (
              <Tabs defaultValue="members" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Team Members</CardTitle>
                          <CardDescription>
                            Manage who has access to {selectedOrg.name}
                          </CardDescription>
                        </div>
                        {['owner', 'admin'].includes(selectedOrg.role) && (
                          <Button onClick={() => setShowInviteModal(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.user.image} />
                                <AvatarFallback>
                                  {member.user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{member.user.name}</h4>
                                <p className="text-sm text-gray-600">{member.user.email}</p>
                                <p className="text-xs text-gray-500">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(member.role)}
                              <Badge className={getRoleBadgeColor(member.role)}>
                                {member.role}
                              </Badge>
                              {['owner', 'admin'].includes(selectedOrg.role) && 
                               member.user.id !== (session?.user as any)?.id && (
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) => updateMemberRole(member.id, value)}
                                  >
                                    <SelectTrigger className="w-24 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      {selectedOrg.role === 'owner' && (
                                        <SelectItem value="owner">Owner</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMember(member.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {invitations.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Pending Invitations</h4>
                          <div className="space-y-2">
                            {invitations.map((invitation) => (
                              <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Mail className="w-4 h-4 text-yellow-600" />
                                  <div>
                                    <p className="font-medium">{invitation.email}</p>
                                    <p className="text-sm text-gray-600">
                                      Invited by {invitation.inviter.name} • 
                                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={getRoleBadgeColor(invitation.role)}>
                                  {invitation.role}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Settings</CardTitle>
                      <CardDescription>
                        Manage your organization's basic information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input id="org-name" value={selectedOrg.name} readOnly />
                      </div>
                      <div>
                        <Label htmlFor="org-type">Type</Label>
                        <Input id="org-type" value={selectedOrg.type} readOnly />
                      </div>
                      <div>
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea 
                          id="org-description" 
                          value={selectedOrg.description || ''} 
                          readOnly 
                          placeholder="No description provided"
                        />
                      </div>
                      {selectedOrg.role === 'owner' && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
                          <Button variant="destructive">
                            Delete Organization
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Set up a new organization to collaborate with your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-org-name">Organization Name</Label>
              <Input
                id="new-org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Acme Law Firm"
              />
            </div>
            <div>
              <Label htmlFor="new-org-type">Type</Label>
              <Select value={newOrgType} onValueChange={setNewOrgType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="law_firm">Law Firm</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="solo">Solo Practice</SelectItem>
                  <SelectItem value="consultant">Legal Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-org-description">Description (Optional)</Label>
              <Textarea
                id="new-org-description"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                placeholder="Brief description of your organization"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createOrganization} disabled={!newOrgName}>
              Create Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Can view content</SelectItem>
                  <SelectItem value="member">Member - Can create and edit</SelectItem>
                  <SelectItem value="admin">Admin - Can manage members</SelectItem>
                  {selectedOrg?.role === 'owner' && (
                    <SelectItem value="owner">Owner - Full access</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={inviteMember} disabled={!inviteEmail}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
