'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Organization {
  id: string
  name: string
  type: string
  role: string
  memberCount: number
  workspaceCount: number
}

interface Workspace {
  id: string
  name: string
  type: string
  role: string
  memberCount: number
  projectCount: number
  organization?: {
    id: string
    name: string
  }
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  currentWorkspace: Workspace | null
  organizations: Organization[]
  workspaces: Workspace[]
  setCurrentOrganization: (org: Organization | null) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  refreshData: () => Promise<void>
  isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

interface OrganizationProviderProps {
  children: ReactNode
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    // Save to localStorage when current org/workspace changes
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id)
    }
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id)
    }
  }, [currentOrganization, currentWorkspace])

  const refreshData = async () => {
    setIsLoading(true)
    try {
      // Check if user is authenticated first
      const sessionResponse = await fetch('/api/auth/session')
      if (!sessionResponse.ok) {
        setIsLoading(false)
        return
      }
      
      const sessionData = await sessionResponse.json()
      if (!sessionData.user) {
        setIsLoading(false)
        return
      }

      const [orgsResponse, workspacesResponse] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/workspaces')
      ])

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        setOrganizations(orgsData.organizations)
        
        // Set current org from localStorage or first org
        const savedOrgId = localStorage.getItem('currentOrganizationId')
        const defaultOrg = savedOrgId 
          ? orgsData.organizations.find((org: Organization) => org.id === savedOrgId)
          : orgsData.organizations[0]
        
        if (defaultOrg && (!currentOrganization || currentOrganization.id !== defaultOrg.id)) {
          setCurrentOrganization(defaultOrg)
        }
      }

      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json()
        setWorkspaces(workspacesData.workspaces)
        
        // Set current workspace from localStorage or first workspace
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
        const defaultWorkspace = savedWorkspaceId
          ? workspacesData.workspaces.find((ws: Workspace) => ws.id === savedWorkspaceId)
          : workspacesData.workspaces[0]
        
        if (defaultWorkspace && (!currentWorkspace || currentWorkspace.id !== defaultWorkspace.id)) {
          setCurrentWorkspace(defaultWorkspace)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations/workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetCurrentOrganization = (org: Organization | null) => {
    setCurrentOrganization(org)
    if (org) {
      // Filter workspaces for this organization
      const orgWorkspaces = workspaces.filter(ws => ws.organization?.id === org.id)
      if (orgWorkspaces.length > 0 && (!currentWorkspace || currentWorkspace.organization?.id !== org.id)) {
        setCurrentWorkspace(orgWorkspaces[0])
      }
    }
  }

  const value: OrganizationContextType = {
    currentOrganization,
    currentWorkspace,
    organizations,
    workspaces,
    setCurrentOrganization: handleSetCurrentOrganization,
    setCurrentWorkspace,
    refreshData,
    isLoading
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}
