import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Resolve organization from custom domain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: 'Domain required' }, { status: 400 })
    }

    // Skip for default domains
    const defaultDomains = ['localhost', 'frithai.com', 'www.frithai.com', 'app.frithai.com']
    if (defaultDomains.some(d => domain.includes(d))) {
      return NextResponse.json({ organizationId: null })
    }

    // Look up branding by custom domain
    const branding = await prisma.organizationBranding.findUnique({
      where: { customDomain: domain },
      select: { organizationId: true, domainVerified: true },
    })

    if (branding?.domainVerified) {
      return NextResponse.json({ organizationId: branding.organizationId })
    }

    return NextResponse.json({ organizationId: null })
  } catch (error) {
    console.error('Error resolving domain:', error)
    return NextResponse.json({ organizationId: null })
  }
}
