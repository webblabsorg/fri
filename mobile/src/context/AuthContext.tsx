import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'

interface User {
  id: string
  email: string
  name: string
  organizationId?: string
}

interface Organization {
  id: string
  name: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  currentOrganization: Organization | null
  organizations: Organization[]
  setCurrentOrganization: (org: Organization) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrgState] = useState<Organization | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (token) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://app.frithai.com'
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user || userData)
          
          // Load user's organizations
          await loadOrganizations(token, apiUrl)
        } else {
          await SecureStore.deleteItemAsync('auth_token')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadOrganizations(token: string, apiUrl: string) {
    try {
      const response = await fetch(`${apiUrl}/api/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const orgs = data.organizations || []
        setOrganizations(orgs)
        
        // Restore saved org or use first one
        const savedOrgId = await SecureStore.getItemAsync('current_org_id')
        const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId)
        if (savedOrg) {
          setCurrentOrgState(savedOrg)
        } else if (orgs.length > 0) {
          setCurrentOrgState(orgs[0])
          await SecureStore.setItemAsync('current_org_id', orgs[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  async function login(email: string, password: string) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://app.frithai.com'
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()
    const token = data.token || data.sessionToken
    const userData = data.user || data
    
    await SecureStore.setItemAsync('auth_token', token)
    setUser(userData)
    
    // Load organizations after login
    await loadOrganizations(token, apiUrl)
  }

  async function logout() {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('current_org_id')
    setUser(null)
    setOrganizations([])
    setCurrentOrgState(null)
  }

  async function getToken() {
    return SecureStore.getItemAsync('auth_token')
  }

  async function setCurrentOrganization(org: Organization) {
    setCurrentOrgState(org)
    await SecureStore.setItemAsync('current_org_id', org.id)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      currentOrganization,
      organizations,
      setCurrentOrganization,
      login, 
      logout, 
      getToken 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
