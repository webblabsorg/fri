'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface BrandingConfig {
  organizationId: string | null
  companyName: string
  tagline: string | null
  logoUrl: string | null
  logoLightUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  supportEmail: string
  hideFooterBranding: boolean
  customCss: string | null
}

const defaultBranding: BrandingConfig = {
  organizationId: null,
  companyName: 'Frith AI',
  tagline: 'AI-Powered Legal Tools',
  logoUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  primaryColor: '#3B82F6',
  secondaryColor: '#6366F1',
  accentColor: '#10B981',
  supportEmail: 'support@frithai.com',
  hideFooterBranding: false,
  customCss: null,
}

const BrandingContext = createContext<BrandingConfig>(defaultBranding)

export function useBranding() {
  return useContext(BrandingContext)
}

interface BrandingProviderProps {
  children: ReactNode
  organizationId?: string | null
}

export function BrandingProvider({ children, organizationId }: BrandingProviderProps) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (organizationId) {
      fetchBranding(organizationId)
    } else {
      // Check for custom domain
      checkCustomDomain()
    }
  }, [organizationId])

  async function fetchBranding(orgId: string) {
    try {
      const response = await fetch(`/api/enterprise/branding?organizationId=${orgId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          setBranding({
            organizationId: orgId,
            companyName: data.branding.companyName || defaultBranding.companyName,
            tagline: data.branding.tagline,
            logoUrl: data.branding.logoUrl,
            logoLightUrl: data.branding.logoLightUrl,
            faviconUrl: data.branding.faviconUrl,
            primaryColor: data.branding.primaryColor || defaultBranding.primaryColor,
            secondaryColor: data.branding.secondaryColor || defaultBranding.secondaryColor,
            accentColor: data.branding.accentColor || defaultBranding.accentColor,
            supportEmail: data.branding.supportEmail || defaultBranding.supportEmail,
            hideFooterBranding: data.branding.hideFooterBranding || false,
            customCss: data.branding.customCss,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
    } finally {
      setLoaded(true)
    }
  }

  async function checkCustomDomain() {
    try {
      const hostname = window.location.hostname
      // Skip for default domains
      if (hostname === 'localhost' || hostname.includes('frithai.com')) {
        setLoaded(true)
        return
      }

      const response = await fetch(`/api/enterprise/branding/resolve?domain=${hostname}`)
      if (response.ok) {
        const data = await response.json()
        if (data.organizationId) {
          fetchBranding(data.organizationId)
          return
        }
      }
    } catch (error) {
      console.error('Error checking custom domain:', error)
    }
    setLoaded(true)
  }

  // Apply CSS variables
  useEffect(() => {
    if (loaded) {
      document.documentElement.style.setProperty('--brand-primary', branding.primaryColor)
      document.documentElement.style.setProperty('--brand-secondary', branding.secondaryColor)
      document.documentElement.style.setProperty('--brand-accent', branding.accentColor)

      // Update favicon if custom
      if (branding.faviconUrl) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
        if (link) {
          link.href = branding.faviconUrl
        }
      }

      // Update page title
      if (branding.companyName !== 'Frith AI') {
        document.title = document.title.replace('Frith AI', branding.companyName)
      }

      // Inject custom CSS
      if (branding.customCss) {
        const styleId = 'custom-branding-css'
        let styleEl = document.getElementById(styleId) as HTMLStyleElement
        if (!styleEl) {
          styleEl = document.createElement('style')
          styleEl.id = styleId
          document.head.appendChild(styleEl)
        }
        styleEl.textContent = branding.customCss
      }
    }
  }, [branding, loaded])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

/**
 * Hook to get branded logo URL
 */
export function useBrandedLogo(variant: 'light' | 'dark' = 'dark') {
  const branding = useBranding()
  
  if (variant === 'light' && branding.logoLightUrl) {
    return branding.logoLightUrl
  }
  
  return branding.logoUrl || '/logo.svg'
}

/**
 * Component to render branded footer
 */
export function BrandedFooter() {
  const branding = useBranding()

  if (branding.hideFooterBranding) {
    return (
      <footer className="py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {branding.companyName}
      </footer>
    )
  }

  return (
    <footer className="py-4 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} {branding.companyName}
      {branding.companyName !== 'Frith AI' && (
        <span className="ml-2">Powered by Frith AI</span>
      )}
    </footer>
  )
}
