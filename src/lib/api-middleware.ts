/**
 * API Middleware Helpers
 *
 * Composable middleware functions for API routes including:
 * - Rate limiting
 * - Authentication checks
 * - Authorization checks
 * - Error handling
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { applyRateLimit, RateLimitTier, getRecommendedTier } from './rate-limiter'

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  rateLimitTier?: RateLimitTier | 'auto'
  skipRateLimit?: boolean
}

/**
 * Middleware context passed to handlers
 */
export interface MiddlewareContext {
  userId: string
  userEmail: string
  isAdmin: boolean
}

/**
 * Route params type for dynamic routes (Next.js 16 format)
 */
export type RouteContext = {
  params: Promise<Record<string, string>>
}

/**
 * API handler type with middleware context
 */
export type ApiHandler = (
  req: Request,
  context: MiddlewareContext
) => Promise<Response>

/**
 * Check if user is admin using email
 * This checks ADMIN_EMAILS environment variable
 */
function isAdminByEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

/**
 * Wrap an API handler with middleware
 *
 * @example
 * ```ts
 * export const GET = withMiddleware(async (req, context) => {
 *   // context.userId is guaranteed to exist
 *   return NextResponse.json({ userId: context.userId })
 * }, { requireAuth: true })
 * ```
 */
export function withMiddleware(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): (req: Request, context: RouteContext) => Promise<Response> {
  return async (req: Request, _context: RouteContext) => {
    try {
      // 1. Apply rate limiting (unless explicitly skipped)
      if (!options.skipRateLimit) {
        const tier =
          options.rateLimitTier === 'auto'
            ? getRecommendedTier(req.url)
            : options.rateLimitTier || RateLimitTier.MODERATE

        const session = await auth()
        const rateLimitError = await applyRateLimit(
          req,
          tier,
          session?.user?.id
        )
        if (rateLimitError) {
          return rateLimitError
        }
      }

      // 2. Check authentication if required
      if (options.requireAuth || options.requireAdmin) {
        const session = await auth()

        if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        // 3. Check if user is admin
        const userIsAdmin = isAdminByEmail(session.user.email || '')

        // 4. Check admin authorization if required
        if (options.requireAdmin && !userIsAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          )
        }

        // 5. Call handler with context
        const context: MiddlewareContext = {
          userId: session.user.id,
          userEmail: session.user.email || '',
          isAdmin: userIsAdmin,
        }

        return await handler(req, context)
      }

      // No auth required - create minimal context
      const context: MiddlewareContext = {
        userId: '',
        userEmail: '',
        isAdmin: false,
      }

      return await handler(req, context)
    } catch (error) {
      console.error('[API Middleware] Error:', error)

      // Handle known error types
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          )
        }
      }

      // Generic error response
      return NextResponse.json(
        { error: 'An error occurred processing your request' },
        { status: 500 }
      )
    }
  }
}

/**
 * Convenience wrapper for authenticated routes
 */
export function withAuth(
  handler: ApiHandler
): (req: Request, context: RouteContext) => Promise<Response> {
  return withMiddleware(handler, { requireAuth: true, rateLimitTier: 'auto' })
}

/**
 * Convenience wrapper for admin-only routes
 */
export function withAdmin(
  handler: ApiHandler
): (req: Request, context: RouteContext) => Promise<Response> {
  return withMiddleware(handler, { requireAuth: true, requireAdmin: true, rateLimitTier: 'auto' })
}

/**
 * Convenience wrapper for expensive operations
 */
export function withExpensiveOp(
  handler: ApiHandler
): (req: Request, context: RouteContext) => Promise<Response> {
  return withMiddleware(handler, { requireAuth: true, rateLimitTier: RateLimitTier.EXPENSIVE })
}

/**
 * Apply rate limiting to existing route handler
 * Useful for migrating existing routes without full refactor
 *
 * @example
 * ```ts
 * export const GET = withRateLimit(async (req) => {
 *   // existing handler code
 * }, RateLimitTier.MODERATE)
 * ```
 */
export function withRateLimit(
  handler: (req: Request, context: RouteContext) => Promise<Response>,
  tier: RateLimitTier | 'auto' = 'auto'
): (req: Request, context: RouteContext) => Promise<Response> {
  return async (req: Request, context: RouteContext) => {
    try {
      // Get tier
      const effectiveTier =
        tier === 'auto' ? getRecommendedTier(req.url) : tier

      // Get user ID if authenticated
      const session = await auth()
      const userId = session?.user?.id

      // Apply rate limit
      const rateLimitError = await applyRateLimit(req, effectiveTier, userId)
      if (rateLimitError) {
        return rateLimitError
      }

      // Call original handler
      return await handler(req, context)
    } catch (error) {
      console.error('[Rate Limit Middleware] Error:', error)
      return NextResponse.json(
        { error: 'An error occurred processing your request' },
        { status: 500 }
      )
    }
  }
}
