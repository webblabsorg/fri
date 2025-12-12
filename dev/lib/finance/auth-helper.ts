import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface AuthResult {
  user: { id: string; role: string } | null
  error: NextResponse | null
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const sessionToken = request.cookies.get('session')?.value

  if (!sessionToken) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const user = await getSessionUser(sessionToken)
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user: { id: user.id, role: user.role }, error: null }
}

export async function checkOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRoles?: string[]
): Promise<{ member: { role: string } | null; error: NextResponse | null }> {
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      status: 'active',
      ...(requiredRoles ? { role: { in: requiredRoles } } : {}),
    },
  })

  if (!member) {
    return {
      member: null,
      error: NextResponse.json({ error: 'Access denied' }, { status: 403 }),
    }
  }

  return { member: { role: member.role }, error: null }
}
