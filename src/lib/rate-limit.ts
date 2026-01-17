/**
 * Rate Limiting Utility
 *
 * Provides rate limiting functionality for API routes to prevent abuse and brute force attacks.
 * Uses Upstash Redis in production or in-memory cache in development.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client only if configured
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

/**
 * In-memory rate limiter for development
 * Simple Map-based implementation with automatic cleanup
 */
class InMemoryRateLimiter {
  private cache: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (value.resetAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  async limit(
    identifier: string,
    options: { max: number; window: number }
  ): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const windowMs = options.window * 1000;
    const entry = this.cache.get(identifier);

    if (!entry || entry.resetAt < now) {
      // New window
      const resetAt = now + windowMs;
      this.cache.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: options.max,
        remaining: options.max - 1,
        reset: resetAt,
      };
    }

    if (entry.count >= options.max) {
      // Rate limit exceeded
      return {
        success: false,
        limit: options.max,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    this.cache.set(identifier, entry);
    return {
      success: true,
      limit: options.max,
      remaining: options.max - entry.count,
      reset: entry.resetAt,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Create in-memory limiter instance
const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Rate limiters for different endpoints
 */

// Login endpoint: 5 attempts per 15 minutes
export const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'ratelimit:login',
      analytics: true,
    })
  : {
      limit: (identifier: string) =>
        inMemoryLimiter.limit(identifier, { max: 5, window: 900 }),
    };

// Signup endpoint: 3 attempts per hour
export const signupLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'ratelimit:signup',
      analytics: true,
    })
  : {
      limit: (identifier: string) =>
        inMemoryLimiter.limit(identifier, { max: 3, window: 3600 }),
    };

// Password reset: 3 attempts per hour
export const passwordResetLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'ratelimit:password-reset',
      analytics: true,
    })
  : {
      limit: (identifier: string) =>
        inMemoryLimiter.limit(identifier, { max: 3, window: 3600 }),
    };

// API endpoints: 60 requests per minute
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'ratelimit:api',
      analytics: true,
    })
  : {
      limit: (identifier: string) =>
        inMemoryLimiter.limit(identifier, { max: 60, window: 60 }),
    };

// Global rate limit: 100 requests per 15 minutes
export const globalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      prefix: 'ratelimit:global',
      analytics: true,
    })
  : {
      limit: (identifier: string) =>
        inMemoryLimiter.limit(identifier, { max: 100, window: 900 }),
    };

/**
 * Helper function to get client identifier from request
 * Uses IP address as identifier, with fallback to a default
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  // In production, you should ensure proper IP forwarding is configured
  return 'unknown-client';
}

/**
 * Apply rate limiting to a request
 * Returns a Response object if rate limit is exceeded, otherwise null
 */
export async function checkRateLimit(
  limiter: typeof loginLimiter,
  identifier: string
): Promise<Response | null> {
  const result = await limiter.limit(identifier);

  // Add rate limit headers
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  });

  if (!result.success) {
    // Calculate retry-after in seconds
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    headers.set('Retry-After', retryAfter.toString());

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(headers.entries()),
        },
      }
    );
  }

  return null;
}

/**
 * Configuration status - useful for debugging
 */
export const rateLimitConfig = {
  redisConfigured: isRedisConfigured,
  mode: isRedisConfigured ? 'redis' : 'in-memory',
  limits: {
    login: '5 requests per 15 minutes',
    signup: '3 requests per hour',
    passwordReset: '3 requests per hour',
    api: '60 requests per minute',
    global: '100 requests per 15 minutes',
  },
};

// Log rate limit configuration on startup
if (process.env.NODE_ENV !== 'production') {
  console.log('[Rate Limit] Configuration:', rateLimitConfig);
}
