import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'

/**
 * SCIM 2.0 User Provisioning Endpoints
 * Spec: RFC 7644 - https://datatracker.ietf.org/doc/html/rfc7644
 */

// SCIM Schema URIs
const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User'
const SCIM_LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'

interface SCIMUser {
  schemas: string[]
  id: string
  externalId?: string
  userName: string
  name?: {
    formatted?: string
    familyName?: string
    givenName?: string
  }
  emails?: Array<{ value: string; primary?: boolean; type?: string }>
  active: boolean
  meta: {
    resourceType: string
    created: string
    lastModified: string
    location: string
  }
}

// Validate SCIM bearer token
async function validateSCIMToken(request: NextRequest): Promise<{ valid: boolean; organizationId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.substring(7)

  // Look up SCIM token in SSOConfig
  const ssoConfig = await prisma.sSOConfig.findFirst({
    where: {
      enabled: true,
      // Store SCIM token in a field - using oauthClientSecret for now
      // In production, add a dedicated scimToken field
    },
  })

  // For now, validate against environment variable per org
  // In production, store hashed tokens per organization
  const expectedToken = process.env.SCIM_BEARER_TOKEN
  if (!expectedToken || token !== expectedToken) {
    return { valid: false, error: 'Invalid SCIM token' }
  }

  // Get organization from header or query
  const orgId = request.headers.get('x-organization-id') || 
                new URL(request.url).searchParams.get('organizationId')

  if (!orgId) {
    return { valid: false, error: 'Organization ID required' }
  }

  return { valid: true, organizationId: orgId }
}

// Convert internal user to SCIM format
function toSCIMUser(user: any, baseUrl: string): SCIMUser {
  return {
    schemas: [SCIM_USER_SCHEMA],
    id: user.id,
    userName: user.email,
    name: {
      formatted: user.name,
      givenName: user.name?.split(' ')[0],
      familyName: user.name?.split(' ').slice(1).join(' '),
    },
    emails: [
      {
        value: user.email,
        primary: true,
        type: 'work',
      },
    ],
    active: user.status !== 'suspended',
    meta: {
      resourceType: 'User',
      created: user.createdAt.toISOString(),
      lastModified: user.updatedAt.toISOString(),
      location: `${baseUrl}/api/enterprise/scim/users/${user.id}`,
    },
  }
}

// GET /api/enterprise/scim/users - List users or get single user
export async function GET(request: NextRequest) {
  const auth = await validateSCIMToken(request)
  if (!auth.valid) {
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: auth.error, status: 401 },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter')
  const startIndex = parseInt(searchParams.get('startIndex') || '1')
  const count = parseInt(searchParams.get('count') || '100')

  try {
    // Get organization members
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: auth.organizationId },
      include: { user: true },
      skip: startIndex - 1,
      take: count,
    })

    const total = await prisma.organizationMember.count({
      where: { organizationId: auth.organizationId },
    })

    const baseUrl = new URL(request.url).origin
    const users = members.map(m => toSCIMUser(m.user, baseUrl))

    return NextResponse.json({
      schemas: [SCIM_LIST_SCHEMA],
      totalResults: total,
      startIndex,
      itemsPerPage: count,
      Resources: users,
    })
  } catch (error) {
    console.error('SCIM list users error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}

// POST /api/enterprise/scim/users - Create user
export async function POST(request: NextRequest) {
  const auth = await validateSCIMToken(request)
  if (!auth.valid) {
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: auth.error, status: 401 },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const email = body.userName || body.emails?.[0]?.value
    const name = body.name?.formatted || 
                 `${body.name?.givenName || ''} ${body.name?.familyName || ''}`.trim() ||
                 email.split('@')[0]

    if (!email) {
      return NextResponse.json(
        { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'userName or email required', status: 400 },
        { status: 400 }
      )
    }

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          email,
          name,
          emailVerified: true, // SCIM-provisioned users are pre-verified
          passwordHash: '', // No password for SCIM users
        },
      })
    }

    // Add to organization if not already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: auth.organizationId!,
          userId: user.id,
        },
      },
    })

    if (!existingMember) {
      await prisma.organizationMember.create({
        data: {
          organizationId: auth.organizationId!,
          userId: user.id,
          role: 'member',
        },
      })
    }

    await logAuditEvent({
      organizationId: auth.organizationId,
      eventType: 'scim_user_created',
      eventCategory: 'admin',
      resourceType: 'user',
      resourceId: user.id,
      action: 'create',
      details: { email },
    })

    const baseUrl = new URL(request.url).origin
    return NextResponse.json(toSCIMUser(user, baseUrl), { status: 201 })
  } catch (error) {
    console.error('SCIM create user error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}
