/**
 * Comprehensive Rate Limiting System
 *
 * Supports both Redis-based (production) and in-memory (development) rate limiting
 * with automatic fallback. Provides different rate limit tiers for various endpoint types.
 *
 * Tiers:
 * - STRICT: Very limited (auth, signup) - 5 requests / 15 minutes
 * - EXPENSIVE: ML, import, export - 10 requests / hour
 * - MODERATE: Standard API - 100 requests / 15 minutes
 * - LENIENT: Read-only operations - 300 requests / 15 minutes
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { checkRateLimit as inMemoryCheckRateLimit } from './rate-limit'

// Rate limit tier configurations
export enum RateLimitTier {
  STRICT = 'STRICT',
  EXPENSIVE = 'EXPENSIVE',
  MODERATE = 'MODERATE',
  LENIENT = 'LENIENT',
}

interface RateLimitConfig {
  tokens: number
  windowSeconds: number // e.g., 900 for 15 minutes, 3600 for 1 hour
  windowMs: number // milliseconds for fallback
}

const TIER_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  [RateLimitTier.STRICT]: {
    tokens: 5,
    windowSeconds: 15 * 60, // 15 minutes
    windowMs: 15 * 60 * 1000,
  },
  [RateLimitTier.EXPENSIVE]: {
    tokens: 10,
    windowSeconds: 60 * 60, // 1 hour
    windowMs: 60 * 60 * 1000,
  },
  [RateLimitTier.MODERATE]: {
    tokens: 100,
    windowSeconds: 15 * 60, // 15 minutes
    windowMs: 15 * 60 * 1000,
  },
  [RateLimitTier.LENIENT]: {
    tokens: 300,
    windowSeconds: 15 * 60, // 15 minutes
    windowMs: 15 * 60 * 1000,
  },
}

// Redis client (only initialized if credentials are available)
let redis: Redis | null = null
let rateLimiters: Map<RateLimitTier, Ratelimit> | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Create rate limiters for each tier
    rateLimiters = new Map([
      [
        RateLimitTier.STRICT,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            TIER_CONFIGS[RateLimitTier.STRICT].tokens,
            `${TIER_CONFIGS[RateLimitTier.STRICT].windowSeconds} s`
          ),
          analytics: true,
          prefix: 'ratelimit:strict',
        }),
      ],
      [
        RateLimitTier.EXPENSIVE,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            TIER_CONFIGS[RateLimitTier.EXPENSIVE].tokens,
            `${TIER_CONFIGS[RateLimitTier.EXPENSIVE].windowSeconds} s`
          ),
          analytics: true,
          prefix: 'ratelimit:expensive',
        }),
      ],
      [
        RateLimitTier.MODERATE,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            TIER_CONFIGS[RateLimitTier.MODERATE].tokens,
            `${TIER_CONFIGS[RateLimitTier.MODERATE].windowSeconds} s`
          ),
          analytics: true,
          prefix: 'ratelimit:moderate',
        }),
      ],
      [
        RateLimitTier.LENIENT,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            TIER_CONFIGS[RateLimitTier.LENIENT].tokens,
            `${TIER_CONFIGS[RateLimitTier.LENIENT].windowSeconds} s`
          ),
          analytics: true,
          prefix: 'ratelimit:lenient',
        }),
      ],
    ])

    if (process.env.NODE_ENV === 'development') {
      console.log('[Rate Limiter] Using Redis-based rate limiting')
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Rate Limiter] Redis not configured, using in-memory rate limiting')
    }
  }
} catch (error) {
  console.error('[Rate Limiter] Failed to initialize Redis:', error)
  redis = null
  rateLimiters = null
}

// In-memory fallback store for non-STRICT tiers
interface InMemoryRateLimitEntry {
  count: number
  resetAt: number
}

const inMemoryStore = new Map<string, InMemoryRateLimitEntry>()

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []

  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetAt) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => inMemoryStore.delete(key))
}, 60 * 1000)

/**
 * Check rate limit for in-memory fallback
 */
function checkInMemoryRateLimit(
  identifier: string,
  tier: RateLimitTier
): {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
} {
  // Use existing in-memory implementation for STRICT tier
  if (tier === RateLimitTier.STRICT) {
    return inMemoryCheckRateLimit(identifier)
  }

  const config = TIER_CONFIGS[tier]
  const now = Date.now()
  const key = `${tier}:${identifier}`
  const entry = inMemoryStore.get(key)

  // No entry exists - first attempt
  if (!entry) {
    const resetAt = now + config.windowMs
    inMemoryStore.set(key, {
      count: 1,
      resetAt,
    })

    return {
      success: true,
      limit: config.tokens,
      remaining: config.tokens - 1,
      reset: resetAt,
    }
  }

  // Entry exists but window has expired - reset
  if (now > entry.resetAt) {
    const resetAt = now + config.windowMs
    inMemoryStore.set(key, {
      count: 1,
      resetAt,
    })

    return {
      success: true,
      limit: config.tokens,
      remaining: config.tokens - 1,
      reset: resetAt,
    }
  }

  // Entry exists and within window - check count
  if (entry.count >= config.tokens) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)

    return {
      success: false,
      limit: config.tokens,
      remaining: 0,
      reset: entry.resetAt,
      retryAfter,
    }
  }

  // Increment count
  entry.count += 1
  inMemoryStore.set(key, entry)

  return {
    success: true,
    limit: config.tokens,
    remaining: config.tokens - entry.count,
    reset: entry.resetAt,
  }
}

/**
 * Check rate limit for a given identifier and tier
 */
export async function checkRateLimitTier(
  identifier: string,
  tier: RateLimitTier = RateLimitTier.MODERATE
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}> {
  // Use Redis if available
  if (rateLimiters && redis) {
    try {
      const limiter = rateLimiters.get(tier)
      if (!limiter) {
        throw new Error(`Rate limiter not found for tier: ${tier}`)
      }

      const result = await limiter.limit(identifier)

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      console.error('[Rate Limiter] Redis check failed, falling back to in-memory:', error)
      // Fall through to in-memory
    }
  }

  // Fallback to in-memory rate limiting
  return checkInMemoryRateLimit(identifier, tier)
}

/**
 * Get IP address from request
 */
export function getIpFromRequest(req: Request): string {
  // Try to get IP from headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to unknown
  return 'unknown'
}

/**
 * Get identifier for authenticated users (prefer user ID over IP)
 */
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  return `ip:${getIpFromRequest(req)}`
}

/**
 * Apply rate limit and return error response if exceeded
 * Returns null if rate limit is not exceeded
 */
export async function applyRateLimit(
  req: Request,
  tier: RateLimitTier = RateLimitTier.MODERATE,
  userId?: string
): Promise<Response | null> {
  const identifier = getIdentifier(req, userId)
  const result = await checkRateLimitTier(identifier, tier)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '900',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        },
      }
    )
  }

  return null
}

/**
 * Get recommended tier for an endpoint based on operation type
 */
export function getRecommendedTier(endpoint: string): RateLimitTier {
  // Auth endpoints - very strict
  if (endpoint.includes('/auth/signup') || endpoint.includes('/auth/signin')) {
    return RateLimitTier.STRICT
  }

  // Expensive operations
  if (
    endpoint.includes('/ml/train') ||
    endpoint.includes('/transactions/import') ||
    endpoint.includes('/transactions/categorize') ||
    endpoint.includes('/merchants/research') ||
    endpoint.includes('/import/parse')
  ) {
    return RateLimitTier.EXPENSIVE
  }

  // Read-only operations
  if (
    endpoint.includes('/dashboard') ||
    endpoint.includes('/insights') ||
    endpoint.includes('/stats') ||
    endpoint.includes('/analytics')
  ) {
    return RateLimitTier.LENIENT
  }

  // Default moderate for everything else
  return RateLimitTier.MODERATE
}

/**
 * Export Redis client for other uses (caching, etc.)
 */
export { redis }
