import { NextRequest } from 'next/server'

export interface AuditContext {
  ipAddress?: string
  userAgent?: string
}

/**
 * Extract audit context (IP address and user agent) from a Next.js request
 * for use in audit logging
 */
export function getAuditContext(request: NextRequest): AuditContext {
  // Get IP address from various headers (in order of preference)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  let ipAddress: string | undefined = undefined
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one (client)
    ipAddress = forwardedFor.split(',')[0].trim()
  } else if (realIp) {
    ipAddress = realIp
  } else if (cfConnectingIp) {
    ipAddress = cfConnectingIp
  }
  
  // Get user agent
  const userAgent = request.headers.get('user-agent')
  
  return {
    ipAddress,
    userAgent: userAgent ?? undefined,
  }
}

/**
 * Format audit context for logging/display
 */
export function formatAuditContext(context: AuditContext): string {
  const parts: string[] = []
  if (context.ipAddress) {
    parts.push(`IP: ${context.ipAddress}`)
  }
  if (context.userAgent) {
    // Truncate long user agents
    const ua = context.userAgent.length > 100 
      ? context.userAgent.substring(0, 100) + '...'
      : context.userAgent
    parts.push(`UA: ${ua}`)
  }
  return parts.join(' | ') || 'No context available'
}
