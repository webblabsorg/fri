'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building, Users, ChevronDown, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useOrganization } from '@/components/providers/OrganizationProvider'

export default function OrganizationSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    currentOrganization,
    currentWorkspace,
    organizations,
    workspaces,
    setCurrentOrganization,
    setCurrentWorkspace,
    refreshData,
    isLoading
  } = useOrganization()
  
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
      
      // Redirect to organization page if currently on org-specific pages
      if (pathname.includes('/organization')) {
        router.push('/dashboard/organization')
      }
    }
  }

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }

  const createOrganization = async () => {
    if (!newOrgName.trim()) return

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgName,
          type: 'law_firm'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentOrganization(data.organization)
        setShowCreateOrg(false)
        setNewOrgName('')
        toast.success('Organization created successfully')
        refreshData() // Refresh data
      } else {
        toast.error('Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization')
    }
  }

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName,
          organizationId: currentOrganization?.id,
          type: 'team'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentWorkspace(data.workspace)
        setShowCreateWorkspace(false)
        setNewWorkspaceName('')
        toast.success('Workspace created successfully')
        refreshData() // Refresh data
      } else {
        toast.error('Failed to create workspace')
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast.error('Failed to create workspace')
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {/* Organization Switcher */}
      <div className="flex items-center gap-2">
        <Building className="w-4 h-4 text-gray-500" />
        <Select value={currentOrganization?.id || ''} onValueChange={handleOrganizationChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select organization">
              {currentOrganization && (
                <div className="flex items-center gap-2">
                  <span className="truncate">{currentOrganization.name}</span>
                  <Badge className={getRoleBadgeColor(currentOrganization.role)} variant="secondary">
                    {currentOrganization.role}
                  </Badge>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{org.name}</span>
                  <Badge className={getRoleBadgeColor(org.role)} variant="secondary">
                    {org.role}
                  </Badge>
                </div>
              </SelectItem>
            ))}
            <div className="border-t pt-2 mt-2">
              <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
                <DialogTrigger>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Create a new organization to collaborate with your team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Acme Law Firm"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateOrg(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createOrganization} disabled={!newOrgName.trim()}>
                      Create Organization
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Workspace Switcher */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-500" />
        <Select value={currentWorkspace?.id || ''} onValueChange={handleWorkspaceChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select workspace">
              {currentWorkspace && (
                <div className="flex items-center gap-2">
                  <span className="truncate">{currentWorkspace.name}</span>
                  <Badge className={getRoleBadgeColor(currentWorkspace.role)} variant="secondary">
                    {currentWorkspace.role}
                  </Badge>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="truncate">{workspace.name}</span>
                    {workspace.organization && (
                      <div className="text-xs text-gray-500">{workspace.organization.name}</div>
                    )}
                  </div>
                  <Badge className={getRoleBadgeColor(workspace.role)} variant="secondary">
                    {workspace.role}
                  </Badge>
                </div>
              </SelectItem>
            ))}
            <div className="border-t pt-2 mt-2">
              <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
                <DialogTrigger>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workspace
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                      Create a new workspace for your team projects
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="workspace-name">Workspace Name</Label>
                      <Input
                        id="workspace-name"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder="Legal Research Team"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateWorkspace(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createWorkspace} disabled={!newWorkspaceName.trim()}>
                      Create Workspace
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
