/**
 * IP Whitelist Enforcement Middleware
 * Validates client IP against organization whitelist for enterprise security
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Check if an IP address matches a whitelist entry
 * Supports both single IPs and CIDR notation
 */
export function ipMatchesEntry(clientIP: string, whitelistEntry: string): boolean {
  // Handle exact match
  if (clientIP === whitelistEntry) {
    return true
  }

  // Handle CIDR notation (e.g., 192.168.1.0/24)
  if (whitelistEntry.includes('/')) {
    return ipInCIDR(clientIP, whitelistEntry)
  }

  return false
}

/**
 * Check if an IP is within a CIDR range
 */
function ipInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/')
  const mask = parseInt(bits, 10)

  if (isNaN(mask) || mask < 0 || mask > 32) {
    return false
  }

  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(range)

  if (ipNum === null || rangeNum === null) {
    return false
  }

  const maskNum = ~(2 ** (32 - mask) - 1)
  return (ipNum & maskNum) === (rangeNum & maskNum)
}

/**
 * Convert IP address to number for comparison
 */
function ipToNumber(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) {
    return null
  }

  let num = 0
  for (const part of parts) {
    const octet = parseInt(part, 10)
    if (isNaN(octet) || octet < 0 || octet > 255) {
      return null
    }
    num = (num << 8) + octet
  }
  return num >>> 0 // Convert to unsigned
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback - in production this would come from the connection
  return '127.0.0.1'
}

/**
 * Check if IP is whitelisted for an organization
 */
export async function isIPWhitelisted(
  organizationId: string,
  clientIP: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get whitelist entries for the organization
    const whitelist = await prisma.iPWhitelist.findMany({
      where: {
        organizationId,
        enabled: true,
      },
    })

    // If no whitelist entries, allow all IPs
    if (whitelist.length === 0) {
      return { allowed: true, reason: 'No whitelist configured' }
    }

    // Check if client IP matches any whitelist entry
    for (const entry of whitelist) {
      if (ipMatchesEntry(clientIP, entry.ipAddress)) {
        return { allowed: true, reason: `Matched whitelist entry: ${entry.description || entry.ipAddress}` }
      }
    }

    return { allowed: false, reason: 'IP not in whitelist' }
  } catch (error) {
    console.error('Error checking IP whitelist:', error)
    // Fail open on error to avoid blocking legitimate users
    return { allowed: true, reason: 'Whitelist check error - allowing' }
  }
}

/**
 * Get organization ID from user session
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { organizationId: true },
    })
    return membership?.organizationId || null
  } catch (error) {
    console.error('Error getting user organization:', error)
    return null
  }
}

/**
 * Check if organization has IP whitelist enabled
 */
export async function hasIPWhitelistEnabled(organizationId: string): Promise<boolean> {
  try {
    const count = await prisma.iPWhitelist.count({
      where: {
        organizationId,
        enabled: true,
      },
    })
    return count > 0
  } catch (error) {
    console.error('Error checking IP whitelist status:', error)
    return false
  }
}

/**
 * Middleware to enforce IP whitelist
 */
export async function enforceIPWhitelist(
  request: NextRequest,
  organizationId: string
): Promise<NextResponse | null> {
  const clientIP = getClientIP(request)
  const result = await isIPWhitelisted(organizationId, clientIP)

  if (!result.allowed) {
    // Log the blocked attempt
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId,
        eventType: 'ip_blocked',
        eventCategory: 'security',
        action: 'read',
        details: {
          clientIP,
          reason: result.reason,
          path: request.nextUrl.pathname,
        },
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent'),
        riskLevel: 'high',
      },
    })

    return NextResponse.json(
      { error: 'Access denied: IP not whitelisted', code: 'IP_BLOCKED' },
      { status: 403 }
    )
  }

  return null // Allow request to proceed
}

/**
 * Add IP to whitelist
 */
export async function addIPToWhitelist(
  organizationId: string,
  ipAddress: string,
  createdById: string,
  description?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Validate IP format
    if (!isValidIPOrCIDR(ipAddress)) {
      return { success: false, error: 'Invalid IP address or CIDR format' }
    }

    // Check for duplicates
    const existing = await prisma.iPWhitelist.findFirst({
      where: {
        organizationId,
        ipAddress,
      },
    })

    if (existing) {
      return { success: false, error: 'IP already in whitelist' }
    }

    const entry = await prisma.iPWhitelist.create({
      data: {
        organizationId,
        ipAddress,
        description,
        createdById,
        enabled: true,
      },
    })

    return { success: true, id: entry.id }
  } catch (error) {
    console.error('Error adding IP to whitelist:', error)
    return { success: false, error: 'Failed to add IP' }
  }
}

/**
 * Validate IP address or CIDR format
 */
function isValidIPOrCIDR(value: string): boolean {
  // Check for CIDR
  if (value.includes('/')) {
    const [ip, bits] = value.split('/')
    const mask = parseInt(bits, 10)
    if (isNaN(mask) || mask < 0 || mask > 32) {
      return false
    }
    return isValidIP(ip)
  }

  return isValidIP(value)
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) {
    return false
  }

  for (const part of parts) {
    const octet = parseInt(part, 10)
    if (isNaN(octet) || octet < 0 || octet > 255) {
      return false
    }
  }

  return true
}
