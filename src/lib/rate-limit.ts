/**
 * In-Memory Rate Limiting
 *
 * Simple rate limiter using Map to track attempts by IP address.
 * Configuration: 5 attempts per IP per 15 minutes
 *
 * Note: This implementation is for single-instance deployments.
 * For production multi-instance deployments, use Redis-based rate limiting
 * (e.g., Upstash Redis with @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  resetAt: number;
}

// Configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean up old entries every 60 seconds

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval reference
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start the cleanup interval to remove old entries
 */
function startCleanup() {
  if (cleanupInterval) return; // Already running

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => rateLimitStore.delete(key));

    // Log cleanup stats in development
    if (process.env.NODE_ENV === 'development' && keysToDelete.length > 0) {
      console.log(`[Rate Limit] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }, CLEANUP_INTERVAL_MS);

  // Ensure cleanup stops when process exits
  if (typeof process !== 'undefined') {
    process.on('beforeExit', () => {
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
      }
    });
  }
}

// Start cleanup on module load
startCleanup();

/**
 * Check if an IP address has exceeded the rate limit
 *
 * @param identifier - IP address or other unique identifier
 * @returns Object with success status and metadata
 */
export function checkRateLimit(identifier: string): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry exists - first attempt
  if (!entry) {
    const resetAt = now + WINDOW_MS;
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      resetAt,
    });

    return {
      success: true,
      limit: MAX_ATTEMPTS,
      remaining: MAX_ATTEMPTS - 1,
      reset: resetAt,
    };
  }

  // Entry exists but window has expired - reset
  if (now > entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      resetAt,
    });

    return {
      success: true,
      limit: MAX_ATTEMPTS,
      remaining: MAX_ATTEMPTS - 1,
      reset: resetAt,
    };
  }

  // Entry exists and within window - check count
  if (entry.count >= MAX_ATTEMPTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // seconds

    return {
      success: false,
      limit: MAX_ATTEMPTS,
      remaining: 0,
      reset: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    limit: MAX_ATTEMPTS,
    remaining: MAX_ATTEMPTS - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Reset the rate limit for a specific identifier
 * Useful when a user successfully authenticates
 *
 * @param identifier - IP address or other unique identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status for an identifier without incrementing
 *
 * @param identifier - IP address or other unique identifier
 * @returns Current status or null if no entry exists
 */
export function getRateLimitStatus(identifier: string): {
  count: number;
  limit: number;
  remaining: number;
  reset: number;
  resetIn: number;
} | null {
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    return null;
  }

  const now = Date.now();

  // Entry expired
  if (now > entry.resetAt) {
    rateLimitStore.delete(identifier);
    return null;
  }

  return {
    count: entry.count,
    limit: MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    reset: entry.resetAt,
    resetIn: Math.ceil((entry.resetAt - now) / 1000), // seconds
  };
}

/**
 * Clear all rate limit entries
 * Useful for testing or manual resets
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get statistics about the rate limit store
 * Useful for monitoring and debugging
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;

  for (const entry of rateLimitStore.values()) {
    if (now > entry.resetAt) {
      expiredEntries += 1;
    } else {
      activeEntries += 1;
    }
  }

  return {
    totalEntries: rateLimitStore.size,
    activeEntries,
    expiredEntries,
  };
}
