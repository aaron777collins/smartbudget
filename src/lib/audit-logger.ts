/**
 * Audit Logging System
 *
 * Provides comprehensive audit logging for security events and data operations.
 * Tracks who did what, when, from where, and whether it succeeded.
 */

import { prisma } from '@/lib/prisma';
import type {
  AuditAction,
  AuditStatus,
  SecurityEventType,
  SecuritySeverity
} from '@prisma/client';

/**
 * Request context information for audit logs
 */
export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Extract audit context from Next.js request
 */
export function getAuditContext(request: Request): AuditContext {
  const headers = request.headers;

  return {
    ipAddress: headers.get('x-forwarded-for') ||
               headers.get('x-real-ip') ||
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
  };
}

/**
 * Log a general audit event (CRUD operations, data access, etc.)
 */
export async function logAudit(params: {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  status?: AuditStatus;
  errorMessage?: string;
  metadata?: Record<string, any>;
  context?: AuditContext;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues || null,
        newValues: params.newValues || null,
        status: params.status || 'SUCCESS',
        errorMessage: params.errorMessage,
        metadata: params.metadata || null,
        ipAddress: params.context?.ipAddress,
        userAgent: params.context?.userAgent,
      },
    });
  } catch (error) {
    // Don't let audit logging failures break the application
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log a security-specific event (login, logout, permission changes, etc.)
 */
export async function logSecurityEvent(params: {
  userId?: string;
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  description: string;
  success?: boolean;
  failureReason?: string;
  metadata?: Record<string, any>;
  context?: AuditContext;
}): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: params.userId,
        eventType: params.eventType,
        severity: params.severity || 'INFO',
        description: params.description,
        success: params.success !== undefined ? params.success : true,
        failureReason: params.failureReason,
        metadata: params.metadata || null,
        ipAddress: params.context?.ipAddress,
        userAgent: params.context?.userAgent,
      },
    });
  } catch (error) {
    // Don't let security logging failures break the application
    console.error('Failed to create security event log:', error);
  }
}

/**
 * Convenience functions for common security events
 */

export async function logLoginSuccess(
  userId: string,
  context: AuditContext
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: 'LOGIN_SUCCESS',
    severity: 'INFO',
    description: `User ${userId} logged in successfully`,
    success: true,
    context,
  });
}

export async function logLoginFailure(
  email: string,
  reason: string,
  context: AuditContext
): Promise<void> {
  await logSecurityEvent({
    eventType: 'LOGIN_FAILURE',
    severity: 'MEDIUM',
    description: `Failed login attempt for email: ${email}`,
    success: false,
    failureReason: reason,
    metadata: { email },
    context,
  });
}

export async function logAccountLocked(
  userId: string,
  context: AuditContext
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: 'ACCOUNT_LOCKED',
    severity: 'HIGH',
    description: `Account ${userId} locked due to multiple failed login attempts`,
    context,
  });
}

export async function logLogout(
  userId: string,
  context: AuditContext
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: 'LOGOUT',
    severity: 'INFO',
    description: `User ${userId} logged out`,
    success: true,
    context,
  });
}

export async function logPasswordChange(
  userId: string,
  context: AuditContext
): Promise<void> {
  await Promise.all([
    logSecurityEvent({
      userId,
      eventType: 'PASSWORD_CHANGE',
      severity: 'MEDIUM',
      description: `User ${userId} changed their password`,
      context,
    }),
    logAudit({
      userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'user',
      entityId: userId,
      status: 'SUCCESS',
      context,
    }),
  ]);
}

export async function logUnauthorizedAccess(
  userId: string | undefined,
  resource: string,
  context: AuditContext
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    severity: 'HIGH',
    description: `Unauthorized access attempt to ${resource}`,
    success: false,
    failureReason: 'Insufficient permissions',
    metadata: { resource },
    context,
  });
}

export async function logRateLimitExceeded(
  userId: string | undefined,
  endpoint: string,
  context: AuditContext
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: 'RATE_LIMIT_EXCEEDED',
    severity: 'MEDIUM',
    description: `Rate limit exceeded for endpoint: ${endpoint}`,
    success: false,
    metadata: { endpoint },
    context,
  });
}

export async function logDataExport(
  userId: string,
  dataType: string,
  context: AuditContext
): Promise<void> {
  await Promise.all([
    logSecurityEvent({
      userId,
      eventType: 'DATA_EXPORT',
      severity: 'MEDIUM',
      description: `User ${userId} exported ${dataType} data`,
      context,
    }),
    logAudit({
      userId,
      action: 'EXPORT',
      entityType: dataType,
      status: 'SUCCESS',
      context,
    }),
  ]);
}

export async function logDataDeletion(
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, any>,
  context: AuditContext
): Promise<void> {
  await Promise.all([
    logSecurityEvent({
      userId,
      eventType: 'DATA_DELETION',
      severity: 'MEDIUM',
      description: `User ${userId} deleted ${entityType} ${entityId}`,
      metadata: { entityType, entityId },
      context,
    }),
    logAudit({
      userId,
      action: 'DELETE',
      entityType,
      entityId,
      oldValues,
      status: 'SUCCESS',
      context,
    }),
  ]);
}

/**
 * Convenience functions for data operations
 */

export async function logCreate(
  userId: string,
  entityType: string,
  entityId: string,
  newValues: Record<string, any>,
  context: AuditContext
): Promise<void> {
  await logAudit({
    userId,
    action: 'CREATE',
    entityType,
    entityId,
    newValues,
    status: 'SUCCESS',
    context,
  });
}

export async function logUpdate(
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  context: AuditContext
): Promise<void> {
  await logAudit({
    userId,
    action: 'UPDATE',
    entityType,
    entityId,
    oldValues,
    newValues,
    status: 'SUCCESS',
    context,
  });
}

export async function logDelete(
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, any>,
  context: AuditContext
): Promise<void> {
  await logAudit({
    userId,
    action: 'DELETE',
    entityType,
    entityId,
    oldValues,
    status: 'SUCCESS',
    context,
  });
}

/**
 * Query audit logs for analysis
 */

export async function getAuditLogsForUser(
  userId: string,
  limit: number = 100
) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getSecurityEventsForUser(
  userId: string,
  limit: number = 100
) {
  return prisma.securityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getRecentSecurityEvents(
  limit: number = 100,
  severityThreshold: SecuritySeverity = 'MEDIUM'
) {
  const severityOrder = ['LOW', 'INFO', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const minSeverityIndex = severityOrder.indexOf(severityThreshold);
  const severities = severityOrder.slice(minSeverityIndex) as SecuritySeverity[];

  return prisma.securityEvent.findMany({
    where: {
      severity: {
        in: severities,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getFailedLoginAttempts(
  since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
) {
  return prisma.securityEvent.findMany({
    where: {
      eventType: 'LOGIN_FAILURE',
      createdAt: {
        gte: since,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
