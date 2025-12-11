import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'

/**
 * SCIM 2.0 Single User Operations
 */

const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User'

// Validate SCIM bearer token
async function validateSCIMToken(request: NextRequest): Promise<{ valid: boolean; organizationId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.substring(7)
  const expectedToken = process.env.SCIM_BEARER_TOKEN
  
  if (!expectedToken || token !== expectedToken) {
    return { valid: false, error: 'Invalid SCIM token' }
  }

  const orgId = request.headers.get('x-organization-id') || 
                new URL(request.url).searchParams.get('organizationId')

  if (!orgId) {
    return { valid: false, error: 'Organization ID required' }
  }

  return { valid: true, organizationId: orgId }
}

// Convert internal user to SCIM format
function toSCIMUser(user: any, baseUrl: string): any {
  return {
    schemas: [SCIM_USER_SCHEMA],
    id: user.id,
    userName: user.email,
    name: {
      formatted: user.name,
      givenName: user.name?.split(' ')[0],
      familyName: user.name?.split(' ').slice(1).join(' '),
    },
    emails: [{ value: user.email, primary: true, type: 'work' }],
    active: user.status !== 'suspended',
    meta: {
      resourceType: 'User',
      created: user.createdAt.toISOString(),
      lastModified: user.updatedAt.toISOString(),
      location: `${baseUrl}/api/enterprise/scim/users/${user.id}`,
    },
  }
}

// GET /api/enterprise/scim/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await validateSCIMToken(request)
  
  if (!auth.valid) {
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: auth.error, status: 401 },
      { status: 401 }
    )
  }

  try {
    // Verify user is in organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: auth.organizationId,
        userId: id,
      },
      include: { user: true },
    })

    if (!member) {
      return NextResponse.json(
        { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 },
        { status: 404 }
      )
    }

    const baseUrl = new URL(request.url).origin
    return NextResponse.json(toSCIMUser(member.user, baseUrl))
  } catch (error) {
    console.error('SCIM get user error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}

// PUT /api/enterprise/scim/users/[id] - Replace user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await validateSCIMToken(request)
  
  if (!auth.valid) {
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: auth.error, status: 401 },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    // Verify user is in organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: auth.organizationId,
        userId: id,
      },
    })

    if (!member) {
      return NextResponse.json(
        { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 },
        { status: 404 }
      )
    }

    const name = body.name?.formatted || 
                 `${body.name?.givenName || ''} ${body.name?.familyName || ''}`.trim()

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        status: body.active === false ? 'suspended' : 'active',
      },
    })

    await logAuditEvent({
      organizationId: auth.organizationId,
      userId: id,
      eventType: 'scim_user_updated',
      eventCategory: 'admin',
      resourceType: 'user',
      resourceId: id,
      action: 'update',
      details: { active: body.active, name },
    })

    const baseUrl = new URL(request.url).origin
    return NextResponse.json(toSCIMUser(user, baseUrl))
  } catch (error) {
    console.error('SCIM update user error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}

// PATCH /api/enterprise/scim/users/[id] - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await validateSCIMToken(request)
  
  if (!auth.valid) {
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: auth.error, status: 401 },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    // Verify user is in organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: auth.organizationId,
        userId: id,
      },
    })

    if (!member) {
      return NextResponse.json(
        { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 },
        { status: 404 }
      )
    }

    // Process SCIM PATCH operations
    const updates: any = {}
    
    for (const op of body.Operations || []) {
      if (op.op === 'replace' || op.op === 'Replace') {
        if (op.path === 'active') {
          updates.status = op.value === true ? 'active' : 'suspended'
        } else if (op.path === 'name.formatted' || op.path === 'displayName') {
          updates.name = op.value
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
    })

    await logAuditEvent({
      organizationId: auth.organizationId,
      userId: id,
      eventType: 'scim_user_patched',
      eventCategory: 'admin',
      resourceType: 'user',
      resourceId: id,
      action: 'update',
      details: { operations: body.Operations },
    })

    const baseUrl = new URL(request.url).origin
    return NextResponse.json(toSCIMUser(user, baseUrl))
  } catch (error) {
    console.error('SCIM patch user error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}

// DELETE /api/enterprise/scim/users/[id] - Delete/deprovision user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await validateSCIMToken(request)
  
  if (!auth.valid) {
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: auth.error, status: 401 },
      { status: 401 }
    )
  }

  try {
    // Remove from organization (don't delete user entirely)
    const deleted = await prisma.organizationMember.deleteMany({
      where: {
        organizationId: auth.organizationId,
        userId: id,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 },
        { status: 404 }
      )
    }

    await logAuditEvent({
      organizationId: auth.organizationId,
      userId: id,
      eventType: 'scim_user_deprovisioned',
      eventCategory: 'admin',
      resourceType: 'user',
      resourceId: id,
      action: 'delete',
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('SCIM delete user error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}
