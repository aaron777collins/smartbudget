/**
 * Session Management Utilities
 *
 * Handles session timeout and inactivity detection for SmartBudget.
 * Provides utilities for tracking user activity and enforcing session timeouts.
 */

import { prisma } from './prisma'
import { logSecurityEvent } from './audit-logger'

/**
 * Session timeout configuration
 *
 * - MAX_SESSION_AGE: Maximum age of a session before it expires (4 hours)
 * - INACTIVITY_TIMEOUT: Maximum inactivity period (30 minutes)
 * - WARNING_THRESHOLD: Time before expiration to show warning (5 minutes)
 */
export const SESSION_CONFIG = {
  MAX_SESSION_AGE: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
  INACTIVITY_TIMEOUT: 30 * 60 * 1000,  // 30 minutes in milliseconds
  WARNING_THRESHOLD: 5 * 60 * 1000,    // 5 minutes in milliseconds
} as const

/**
 * Check if a session is expired based on inactivity
 *
 * @param lastActivityAt - Last activity timestamp
 * @returns true if session has exceeded inactivity timeout
 */
export function isSessionInactive(lastActivityAt: Date | null): boolean {
  if (!lastActivityAt) return false

  const now = new Date()
  const inactiveFor = now.getTime() - lastActivityAt.getTime()

  return inactiveFor >= SESSION_CONFIG.INACTIVITY_TIMEOUT
}

/**
 * Check if a session is expired based on total age
 *
 * @param sessionCreatedAt - Session creation timestamp
 * @returns true if session has exceeded maximum age
 */
export function isSessionTooOld(sessionCreatedAt: Date | null): boolean {
  if (!sessionCreatedAt) return false

  const now = new Date()
  const sessionAge = now.getTime() - sessionCreatedAt.getTime()

  return sessionAge >= SESSION_CONFIG.MAX_SESSION_AGE
}

/**
 * Check if session should show expiration warning
 *
 * @param lastActivityAt - Last activity timestamp
 * @returns true if within warning threshold of timeout
 */
export function shouldShowWarning(lastActivityAt: Date | null): boolean {
  if (!lastActivityAt) return false

  const now = new Date()
  const inactiveFor = now.getTime() - lastActivityAt.getTime()
  const timeUntilTimeout = SESSION_CONFIG.INACTIVITY_TIMEOUT - inactiveFor

  return timeUntilTimeout > 0 && timeUntilTimeout <= SESSION_CONFIG.WARNING_THRESHOLD
}

/**
 * Get time remaining until session expires (in milliseconds)
 *
 * @param lastActivityAt - Last activity timestamp
 * @returns milliseconds until timeout, or 0 if already expired
 */
export function getTimeUntilExpiration(lastActivityAt: Date | null): number {
  if (!lastActivityAt) return SESSION_CONFIG.INACTIVITY_TIMEOUT

  const now = new Date()
  const inactiveFor = now.getTime() - lastActivityAt.getTime()
  const remaining = SESSION_CONFIG.INACTIVITY_TIMEOUT - inactiveFor

  return Math.max(0, remaining)
}

/**
 * Update user's last activity timestamp
 *
 * @param userId - User ID
 * @returns Updated user object
 */
export async function updateLastActivity(userId: string) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    })
  } catch (error) {
    console.error('Failed to update last activity:', error)
    // Don't throw - activity tracking failure shouldn't crash the app
    return null
  }
}

/**
 * Initialize a new session for a user
 *
 * @param userId - User ID
 * @returns Updated user object
 */
export async function initializeSession(userId: string) {
  try {
    const now = new Date()
    return await prisma.user.update({
      where: { id: userId },
      data: {
        sessionCreatedAt: now,
        lastActivityAt: now,
      },
    })
  } catch (error) {
    console.error('Failed to initialize session:', error)
    return null
  }
}

/**
 * Clear session data for a user (on logout)
 *
 * @param userId - User ID
 */
export async function clearSession(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        sessionCreatedAt: null,
        lastActivityAt: null,
      },
    })
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Validate session and check for expiration
 *
 * @param userId - User ID
 * @param context - Request context for logging
 * @returns Session validation result
 */
export async function validateSession(
  userId: string,
  context?: { ip?: string; userAgent?: string }
): Promise<{
  valid: boolean
  reason?: 'inactive' | 'too_old' | 'not_found'
  timeRemaining?: number
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastActivityAt: true,
        sessionCreatedAt: true,
      },
    })

    if (!user) {
      return { valid: false, reason: 'not_found' }
    }

    // Check if session is too old
    if (isSessionTooOld(user.sessionCreatedAt)) {
      await logSecurityEvent({
        eventType: 'SESSION_EXPIRED',
        userId,
        severity: 'INFO',
        description: 'Session expired due to maximum age exceeded (4 hours)',
        success: false,
        failureReason: 'Session too old',
        context: {
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
        },
      })

      return { valid: false, reason: 'too_old' }
    }

    // Check if session is inactive
    if (isSessionInactive(user.lastActivityAt)) {
      await logSecurityEvent({
        eventType: 'SESSION_EXPIRED',
        userId,
        severity: 'INFO',
        description: 'Session expired due to inactivity (30 minutes)',
        success: false,
        failureReason: 'Session inactive',
        context: {
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
        },
      })

      return { valid: false, reason: 'inactive' }
    }

    // Session is valid - update activity
    await updateLastActivity(userId)

    return {
      valid: true,
      timeRemaining: getTimeUntilExpiration(user.lastActivityAt),
    }
  } catch (error) {
    console.error('Session validation error:', error)
    // On error, assume session is invalid for security
    return { valid: false, reason: 'not_found' }
  }
}

/**
 * Get session status for client-side display
 *
 * @param userId - User ID
 * @returns Session status information
 */
export async function getSessionStatus(userId: string): Promise<{
  expiresIn: number // milliseconds
  showWarning: boolean
  createdAt: Date | null
  lastActivityAt: Date | null
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sessionCreatedAt: true,
      lastActivityAt: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return {
    expiresIn: getTimeUntilExpiration(user.lastActivityAt),
    showWarning: shouldShowWarning(user.lastActivityAt),
    createdAt: user.sessionCreatedAt,
    lastActivityAt: user.lastActivityAt,
  }
}
