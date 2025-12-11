import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'

/**
 * SCIM 2.0 Group Provisioning Endpoints
 * Maps to organization roles/teams
 */

const SCIM_GROUP_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Group'
const SCIM_LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'

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

// For SCIM groups, we map to organization roles
// In a full implementation, you'd have a separate Team/Group model
interface SCIMGroup {
  schemas: string[]
  id: string
  displayName: string
  members: Array<{ value: string; display?: string }>
  meta: {
    resourceType: string
    created: string
    lastModified: string
    location: string
  }
}

// GET /api/enterprise/scim/groups - List groups
export async function GET(request: NextRequest) {
  const auth = await validateSCIMToken(request)
  if (!auth.valid) {
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: auth.error, status: 401 },
      { status: 401 }
    )
  }

  try {
    // Get organization
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
    })

    if (!org) {
      return NextResponse.json(
        { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Organization not found', status: 404 },
        { status: 404 }
      )
    }

    // Get members grouped by role
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: auth.organizationId },
      include: { user: true },
    })

    const roleGroups: Record<string, typeof members> = {}
    for (const member of members) {
      if (!roleGroups[member.role]) {
        roleGroups[member.role] = []
      }
      roleGroups[member.role].push(member)
    }

    const baseUrl = new URL(request.url).origin
    const groups: SCIMGroup[] = Object.entries(roleGroups).map(([role, roleMembers]) => ({
      schemas: [SCIM_GROUP_SCHEMA],
      id: `${auth.organizationId}-${role}`,
      displayName: role.charAt(0).toUpperCase() + role.slice(1) + 's',
      members: roleMembers.map(m => ({
        value: m.userId,
        display: m.user.name || m.user.email,
      })),
      meta: {
        resourceType: 'Group',
        created: org.createdAt.toISOString(),
        lastModified: new Date().toISOString(),
        location: `${baseUrl}/api/enterprise/scim/groups/${auth.organizationId}-${role}`,
      },
    }))

    return NextResponse.json({
      schemas: [SCIM_LIST_SCHEMA],
      totalResults: groups.length,
      startIndex: 1,
      itemsPerPage: groups.length,
      Resources: groups,
    })
  } catch (error) {
    console.error('SCIM list groups error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}

// POST /api/enterprise/scim/groups - Create group (maps to role assignment)
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
    const displayName = body.displayName?.toLowerCase().replace(/s$/, '') || 'member'
    
    // Validate role
    const validRoles = ['owner', 'admin', 'member']
    const role = validRoles.includes(displayName) ? displayName : 'member'

    // Add members to organization with this role
    const memberIds = (body.members || []).map((m: any) => m.value)
    
    for (const userId of memberIds) {
      await prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: auth.organizationId!,
            userId,
          },
        },
        update: { role },
        create: {
          organizationId: auth.organizationId!,
          userId,
          role,
        },
      })
    }

    await logAuditEvent({
      organizationId: auth.organizationId,
      eventType: 'scim_group_created',
      eventCategory: 'admin',
      resourceType: 'group',
      resourceId: `${auth.organizationId}-${role}`,
      action: 'create',
      details: { role, memberCount: memberIds.length },
    })

    const baseUrl = new URL(request.url).origin
    const group: SCIMGroup = {
      schemas: [SCIM_GROUP_SCHEMA],
      id: `${auth.organizationId}-${role}`,
      displayName: role.charAt(0).toUpperCase() + role.slice(1) + 's',
      members: memberIds.map((id: string) => ({ value: id })),
      meta: {
        resourceType: 'Group',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        location: `${baseUrl}/api/enterprise/scim/groups/${auth.organizationId}-${role}`,
      },
    }

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('SCIM create group error:', error)
    return NextResponse.json(
      { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Internal error', status: 500 },
      { status: 500 }
    )
  }
}
