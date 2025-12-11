/**
 * Enhanced Audit Logging Helper
 * Provides standardized audit logging across the application
 */

import { prisma } from '@/lib/db'

export type AuditEventCategory = 'security' | 'data' | 'admin' | 'user'
export type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout'

export interface AuditLogParams {
  organizationId?: string
  userId?: string
  eventType: string
  eventCategory: AuditEventCategory
  resourceType?: string
  resourceId?: string
  action: AuditAction
  details?: object
  ipAddress?: string
  userAgent?: string
  geoLocation?: string
  riskLevel?: AuditRiskLevel
}

/**
 * Log an enhanced audit event
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    await prisma.enhancedAuditLog.create({
      data: {
        organizationId: params.organizationId || '',
        userId: params.userId,
        eventType: params.eventType,
        eventCategory: params.eventCategory,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        geoLocation: params.geoLocation,
        riskLevel: params.riskLevel || 'low',
      },
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log a security event (login, logout, password change, etc.)
 */
export async function logSecurityEvent(
  eventType: string,
  params: Omit<AuditLogParams, 'eventType' | 'eventCategory'>
): Promise<void> {
  return logAuditEvent({
    ...params,
    eventType,
    eventCategory: 'security',
    riskLevel: params.riskLevel || determineSecurityRiskLevel(eventType),
  })
}

/**
 * Log a data event (export, import, delete, etc.)
 */
export async function logDataEvent(
  eventType: string,
  params: Omit<AuditLogParams, 'eventType' | 'eventCategory'>
): Promise<void> {
  return logAuditEvent({
    ...params,
    eventType,
    eventCategory: 'data',
  })
}

/**
 * Log an admin event (settings change, user management, etc.)
 */
export async function logAdminEvent(
  eventType: string,
  params: Omit<AuditLogParams, 'eventType' | 'eventCategory'>
): Promise<void> {
  return logAuditEvent({
    ...params,
    eventType,
    eventCategory: 'admin',
  })
}

/**
 * Log a user event (profile update, preferences, etc.)
 */
export async function logUserEvent(
  eventType: string,
  params: Omit<AuditLogParams, 'eventType' | 'eventCategory'>
): Promise<void> {
  return logAuditEvent({
    ...params,
    eventType,
    eventCategory: 'user',
  })
}

/**
 * Determine risk level based on event type
 */
function determineSecurityRiskLevel(eventType: string): AuditRiskLevel {
  const highRiskEvents = [
    'login_failed',
    'password_reset',
    'mfa_disabled',
    'api_key_created',
    'sso_config_changed',
    'ip_blocked',
  ]
  
  const criticalRiskEvents = [
    'account_locked',
    'suspicious_activity',
    'data_breach_detected',
    'unauthorized_access',
  ]
  
  const mediumRiskEvents = [
    'login_success',
    'logout',
    'password_changed',
    'mfa_enabled',
  ]

  if (criticalRiskEvents.includes(eventType)) return 'critical'
  if (highRiskEvents.includes(eventType)) return 'high'
  if (mediumRiskEvents.includes(eventType)) return 'medium'
  return 'low'
}

/**
 * Extract request metadata for audit logging
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string
  userAgent: string
} {
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded?.split(',')[0]?.trim() || 
    request.headers.get('x-real-ip') || 
    'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return { ipAddress, userAgent }
}
