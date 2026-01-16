import { prisma } from "@/lib/prisma"
import { AuditLogAction } from "@prisma/client"

export interface AuditLogEvent {
  action: AuditLogAction
  userId?: string
  metadata?: Record<string, any>
}

/**
 * Extract IP address from a Request object
 * Checks various headers in order of preference:
 * 1. x-forwarded-for (proxy/load balancer)
 * 2. x-real-ip (nginx proxy)
 * 3. cf-connecting-ip (Cloudflare)
 */
export function getIpFromRequest(req: Request): string | null {
  const headers = req.headers

  // Check x-forwarded-for (may contain multiple IPs, take the first)
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim())
    return ips[0]
  }

  // Check x-real-ip
  const realIp = headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Check cf-connecting-ip (Cloudflare)
  const cfIp = headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp
  }

  return null
}

/**
 * Extract user agent from a Request object
 */
export function getUserAgentFromRequest(req: Request): string | null {
  return req.headers.get("user-agent")
}

/**
 * Log an audit event to the database
 *
 * @param event - The audit event to log
 * @param req - Optional Request object to extract IP and user agent
 * @returns Promise<void>
 */
export async function logAuditEvent(
  event: AuditLogEvent,
  req?: Request
): Promise<void> {
  try {
    const ipAddress = req ? getIpFromRequest(req) : null
    const userAgent = req ? getUserAgentFromRequest(req) : null

    await prisma.auditLog.create({
      data: {
        action: event.action,
        userId: event.userId,
        ipAddress,
        userAgent,
        metadata: event.metadata,
      },
    })
  } catch (error) {
    // Log the error but don't throw - audit logging should never break the main flow
    console.error("Failed to log audit event:", error)
  }
}

/**
 * Convenience function to log a login success event
 */
export async function logLoginSuccess(
  userId: string,
  username: string,
  req?: Request
): Promise<void> {
  await logAuditEvent(
    {
      action: "LOGIN_SUCCESS",
      userId,
      metadata: { username },
    },
    req
  )
}

/**
 * Convenience function to log a login failure event
 */
export async function logLoginFailure(
  username: string,
  reason: string,
  req?: Request
): Promise<void> {
  await logAuditEvent(
    {
      action: "LOGIN_FAILURE",
      metadata: { username, reason },
    },
    req
  )
}

/**
 * Convenience function to log a logout event
 */
export async function logLogout(userId: string, req?: Request): Promise<void> {
  await logAuditEvent(
    {
      action: "LOGOUT",
      userId,
    },
    req
  )
}

/**
 * Convenience function to log a user creation event
 */
export async function logUserCreated(
  userId: string,
  username: string,
  req?: Request
): Promise<void> {
  await logAuditEvent(
    {
      action: "USER_CREATED",
      userId,
      metadata: { username },
    },
    req
  )
}

/**
 * Convenience function to log a password change event
 */
export async function logPasswordChange(
  userId: string,
  req?: Request
): Promise<void> {
  await logAuditEvent(
    {
      action: "PASSWORD_CHANGE",
      userId,
    },
    req
  )
}

/**
 * Convenience function to log a session creation event
 */
export async function logSessionCreated(
  userId: string,
  req?: Request
): Promise<void> {
  await logAuditEvent(
    {
      action: "SESSION_CREATED",
      userId,
    },
    req
  )
}

/**
 * Convenience function to log a session expiration event
 */
export async function logSessionExpired(userId: string): Promise<void> {
  await logAuditEvent({
    action: "SESSION_EXPIRED",
    userId,
  })
}
