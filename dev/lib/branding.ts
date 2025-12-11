/**
 * Organization Branding Helper
 * Resolves and applies custom branding for white-label support
 */

import { prisma } from '@/lib/db'

export interface BrandingConfig {
  organizationId: string
  // Domain
  customDomain: string | null
  domainVerified: boolean
  // Logo & Colors
  logoUrl: string | null
  logoLightUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  // Text
  companyName: string
  tagline: string | null
  supportEmail: string | null
  // Features
  hideFooterBranding: boolean
  customCss: string | null
  customJs: string | null
  // Email
  emailFromName: string | null
  emailHeaderHtml: string | null
  emailFooterHtml: string | null
}

const DEFAULT_BRANDING: Omit<BrandingConfig, 'organizationId'> = {
  customDomain: null,
  domainVerified: false,
  logoUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  primaryColor: '#3B82F6',
  secondaryColor: '#6366F1',
  accentColor: '#10B981',
  companyName: 'Frith AI',
  tagline: 'AI-Powered Legal Tools',
  supportEmail: 'support@frithai.com',
  hideFooterBranding: false,
  customCss: null,
  customJs: null,
  emailFromName: 'Frith AI',
  emailHeaderHtml: null,
  emailFooterHtml: null,
}

/**
 * Get branding configuration for an organization
 */
export async function getOrganizationBranding(
  organizationId: string
): Promise<BrandingConfig> {
  try {
    const branding = await prisma.organizationBranding.findUnique({
      where: { organizationId },
    })

    if (!branding) {
      return { organizationId, ...DEFAULT_BRANDING }
    }

    return {
      organizationId,
      customDomain: branding.customDomain,
      domainVerified: branding.domainVerified,
      logoUrl: branding.logoUrl,
      logoLightUrl: branding.logoLightUrl,
      faviconUrl: branding.faviconUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      companyName: branding.companyName || DEFAULT_BRANDING.companyName,
      tagline: branding.tagline || DEFAULT_BRANDING.tagline,
      supportEmail: branding.supportEmail || DEFAULT_BRANDING.supportEmail,
      hideFooterBranding: branding.hideFooterBranding,
      customCss: branding.customCss,
      customJs: branding.customJs,
      emailFromName: branding.emailFromName || DEFAULT_BRANDING.emailFromName,
      emailHeaderHtml: branding.emailHeaderHtml,
      emailFooterHtml: branding.emailFooterHtml,
    }
  } catch (error) {
    console.error('Error fetching organization branding:', error)
    return { organizationId, ...DEFAULT_BRANDING }
  }
}

/**
 * Resolve organization from custom domain
 */
export async function resolveOrganizationFromDomain(
  hostname: string
): Promise<string | null> {
  try {
    // Skip for default domains
    const defaultDomains = [
      'localhost',
      'frithai.com',
      'www.frithai.com',
      'app.frithai.com',
    ]
    
    if (defaultDomains.some(d => hostname.includes(d))) {
      return null
    }

    const branding = await prisma.organizationBranding.findUnique({
      where: { customDomain: hostname },
      select: { organizationId: true, domainVerified: true },
    })

    if (branding?.domainVerified) {
      return branding.organizationId
    }

    return null
  } catch (error) {
    console.error('Error resolving organization from domain:', error)
    return null
  }
}

/**
 * Generate CSS variables from branding config
 */
export function generateBrandingCssVariables(branding: BrandingConfig): string {
  return `
    :root {
      --brand-primary: ${branding.primaryColor};
      --brand-secondary: ${branding.secondaryColor};
      --brand-accent: ${branding.accentColor};
    }
  `.trim()
}

/**
 * Get branding for email templates
 */
export async function getEmailBranding(
  organizationId?: string
): Promise<{
  fromName: string
  headerHtml: string
  footerHtml: string
  logoUrl: string | null
  companyName: string
  supportEmail: string
}> {
  if (!organizationId) {
    return {
      fromName: DEFAULT_BRANDING.emailFromName!,
      headerHtml: '',
      footerHtml: '',
      logoUrl: null,
      companyName: DEFAULT_BRANDING.companyName,
      supportEmail: DEFAULT_BRANDING.supportEmail!,
    }
  }

  const branding = await getOrganizationBranding(organizationId)

  return {
    fromName: branding.emailFromName || DEFAULT_BRANDING.emailFromName!,
    headerHtml: branding.emailHeaderHtml || '',
    footerHtml: branding.emailFooterHtml || '',
    logoUrl: branding.logoUrl,
    companyName: branding.companyName,
    supportEmail: branding.supportEmail || DEFAULT_BRANDING.supportEmail!,
  }
}
