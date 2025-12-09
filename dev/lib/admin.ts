/**
 * Admin utility functions and middleware
 * Phase 4: Admin Dashboard
 */

import { prisma } from './db'

export type UserRole = 'user' | 'admin' | 'super_admin'

/**
 * Check if user has admin role
 */
export function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Check if user has super admin role
 */
export function isSuperAdmin(role: string): boolean {
  return role === 'super_admin'
}

/**
 * Get user with role check
 */
export async function getAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subscriptionTier: true,
    },
  })

  if (!user || !isAdmin(user.role)) {
    return null
  }

  return user
}

/**
 * Log admin action to audit log
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        eventType: `admin_${action}`,
        eventData: {
          action,
          resourceType,
          resourceId,
          ...details,
        },
      },
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

/**
 * Check admin permission for action
 */
export function hasPermission(
  userRole: string,
  requiredRole: 'admin' | 'super_admin' = 'admin'
): boolean {
  if (requiredRole === 'super_admin') {
    return isSuperAdmin(userRole)
  }
  return isAdmin(userRole)
}
