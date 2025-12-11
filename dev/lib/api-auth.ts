/**
 * API Key Authentication Middleware
 * Validates API keys and enforces rate limits for third-party API access
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export interface APIAuthResult {
  valid: boolean
  organizationId?: string
  apiKeyId?: string
  permissions?: string[]
  error?: string
}

/**
 * Validate an API key from request headers
 */
export async function validateAPIKey(request: NextRequest): Promise<APIAuthResult> {
  const authHeader = request.headers.get('authorization')
  const apiKeyHeader = request.headers.get('x-api-key')
  
  let rawKey: string | null = null

  // Check Authorization header (Bearer token)
  if (authHeader?.startsWith('Bearer ')) {
    rawKey = authHeader.substring(7)
  }
  // Check X-API-Key header
  else if (apiKeyHeader) {
    rawKey = apiKeyHeader
  }

  if (!rawKey) {
    return { valid: false, error: 'No API key provided' }
  }

  // Validate key format
  if (!rawKey.startsWith('fri_live_') && !rawKey.startsWith('fri_test_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  // Hash the key to look it up
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  try {
    const apiKey = await prisma.aPIKey.findUnique({
      where: { keyHash },
    })

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' }
    }

    if (!apiKey.enabled) {
      return { valid: false, error: 'API key is disabled' }
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Check rate limit
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUsage = await prisma.aPIUsage.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: { gte: hourAgo },
      },
    })

    if (recentUsage >= apiKey.rateLimit) {
      return { valid: false, error: 'Rate limit exceeded' }
    }

    // Update last used
    await prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    })

    return {
      valid: true,
      organizationId: apiKey.organizationId,
      apiKeyId: apiKey.id,
      permissions: apiKey.permissions as string[],
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return { valid: false, error: 'Internal error validating API key' }
  }
}

/**
 * Log API usage
 */
export async function logAPIUsage(
  apiKeyId: string,
  organizationId: string,
  request: NextRequest,
  response: NextResponse,
  startTime: number
): Promise<void> {
  try {
    const responseTimeMs = Date.now() - startTime
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded?.split(',')[0]?.trim() || 'unknown'

    await prisma.aPIUsage.create({
      data: {
        apiKeyId,
        organizationId,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        statusCode: response.status,
        responseTimeMs,
        ipAddress,
      },
    })
  } catch (error) {
    console.error('Error logging API usage:', error)
  }
}

/**
 * Check if API key has required permission
 */
export function hasPermission(permissions: string[], required: string): boolean {
  // Check for wildcard
  if (permissions.includes('*')) return true
  
  // Check for exact match
  if (permissions.includes(required)) return true
  
  // Check for category wildcard (e.g., "tools:*" matches "tools:read")
  const [category] = required.split(':')
  if (permissions.includes(`${category}:*`)) return true
  
  return false
}

/**
 * Create API auth error response
 */
export function createAuthErrorResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { error, code: 'AUTH_ERROR' },
    { 
      status,
      headers: {
        'WWW-Authenticate': 'Bearer realm="Frith API"',
      },
    }
  )
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
    { 
      status: 429,
      headers: {
        'Retry-After': '3600',
      },
    }
  )
}

/**
 * Middleware wrapper for API key protected routes
 */
export function withAPIAuth(
  handler: (request: NextRequest, auth: APIAuthResult) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const auth = await validateAPIKey(request)

    if (!auth.valid) {
      if (auth.error === 'Rate limit exceeded') {
        return createRateLimitResponse()
      }
      return createAuthErrorResponse(auth.error || 'Unauthorized')
    }

    if (requiredPermission && !hasPermission(auth.permissions || [], requiredPermission)) {
      return createAuthErrorResponse('Insufficient permissions', 403)
    }

    const response = await handler(request, auth)

    // Log usage asynchronously
    if (auth.apiKeyId && auth.organizationId) {
      logAPIUsage(auth.apiKeyId, auth.organizationId, request, response, startTime)
    }

    return response
  }
}
