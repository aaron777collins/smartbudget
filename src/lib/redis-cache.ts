/**
 * Redis Cache Utility
 *
 * Provides caching functionality using Upstash Redis with automatic fallback.
 * Supports TTL-based expiration and cache invalidation patterns.
 */

import { Redis } from '@upstash/redis'

// Cache key prefixes for organization
export const CACHE_KEYS = {
  DASHBOARD_OVERVIEW: 'dashboard:overview',
  DASHBOARD_SPENDING_TRENDS: 'dashboard:spending-trends',
  DASHBOARD_CATEGORY_BREAKDOWN: 'dashboard:category-breakdown',
  DASHBOARD_CATEGORY_HEATMAP: 'dashboard:category-heatmap',
  DASHBOARD_CASH_FLOW: 'dashboard:cash-flow',
  ML_EMBEDDINGS: 'ml:embeddings',
  ML_TRAINING_DATA: 'ml:training-data',
  CATEGORIES_LIST: 'categories:list',
  TAGS_LIST: 'tags:list',
  ACCOUNTS_LIST: 'accounts:list',
} as const

// TTL constants (in seconds)
export const CACHE_TTL = {
  DASHBOARD: 5 * 60, // 5 minutes
  ML_EMBEDDINGS: 0, // Permanent (manual invalidation)
  LISTS: 15 * 60, // 15 minutes
} as const

// Redis client (shared with rate limiter)
let redis: Redis | null = null

/**
 * Initialize Redis client using Upstash credentials
 */
function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[Redis Cache] Upstash credentials not configured - caching disabled')
    return null
  }

  try {
    redis = new Redis({
      url,
      token,
    })
    return redis
  } catch (error) {
    console.error('[Redis Cache] Failed to initialize Redis client:', error)
    return null
  }
}

/**
 * Get cached value by key
 * @param key Cache key
 * @returns Cached value or null if not found/expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient()
  if (!client) return null

  try {
    const value = await client.get<T>(key)
    if (value) {
      console.log(`[Redis Cache] HIT: ${key}`)
    } else {
      console.log(`[Redis Cache] MISS: ${key}`)
    }
    return value
  } catch (error) {
    console.error(`[Redis Cache] Error getting key ${key}:`, error)
    return null
  }
}

/**
 * Set cached value with TTL
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (0 = no expiration)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.DASHBOARD
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    if (ttl > 0) {
      await client.setex(key, ttl, value)
      console.log(`[Redis Cache] SET: ${key} (TTL: ${ttl}s)`)
    } else {
      await client.set(key, value)
      console.log(`[Redis Cache] SET: ${key} (no expiration)`)
    }
  } catch (error) {
    console.error(`[Redis Cache] Error setting key ${key}:`, error)
  }
}

/**
 * Delete cached value(s) by key or pattern
 * @param keyOrPattern Exact key or pattern with wildcard (*)
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    // If pattern contains wildcard, scan and delete all matching keys
    if (keyOrPattern.includes('*')) {
      const keys = await client.keys(keyOrPattern)
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => client.del(key)))
        console.log(`[Redis Cache] INVALIDATED: ${keyOrPattern} (${keys.length} keys)`)
      }
    } else {
      await client.del(keyOrPattern)
      console.log(`[Redis Cache] INVALIDATED: ${keyOrPattern}`)
    }
  } catch (error) {
    console.error(`[Redis Cache] Error invalidating ${keyOrPattern}:`, error)
  }
}

/**
 * Invalidate all dashboard caches for a user
 * @param userId User ID to invalidate cache for
 */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  await invalidateCache(`${CACHE_KEYS.DASHBOARD_OVERVIEW}:${userId}:*`)
  await invalidateCache(`${CACHE_KEYS.DASHBOARD_SPENDING_TRENDS}:${userId}:*`)
  await invalidateCache(`${CACHE_KEYS.DASHBOARD_CATEGORY_BREAKDOWN}:${userId}:*`)
  await invalidateCache(`${CACHE_KEYS.DASHBOARD_CATEGORY_HEATMAP}:${userId}:*`)
  await invalidateCache(`${CACHE_KEYS.DASHBOARD_CASH_FLOW}:${userId}:*`)
}

/**
 * Invalidate all ML-related caches for a user
 * @param userId User ID to invalidate cache for
 */
export async function invalidateMLCache(userId: string): Promise<void> {
  await invalidateCache(`${CACHE_KEYS.ML_EMBEDDINGS}:${userId}`)
  await invalidateCache(`${CACHE_KEYS.ML_TRAINING_DATA}:${userId}`)
}

/**
 * Invalidate list caches (categories, tags, accounts)
 * @param userId User ID to invalidate cache for
 */
export async function invalidateListCaches(userId: string): Promise<void> {
  await invalidateCache(`${CACHE_KEYS.CATEGORIES_LIST}:${userId}`)
  await invalidateCache(`${CACHE_KEYS.TAGS_LIST}:${userId}`)
  await invalidateCache(`${CACHE_KEYS.ACCOUNTS_LIST}:${userId}`)
}

/**
 * Generate cache key for dashboard endpoint
 * @param prefix Cache key prefix
 * @param userId User ID
 * @param params Query parameters
 * @returns Cache key
 */
export function generateCacheKey(
  prefix: string,
  userId: string,
  params: Record<string, unknown> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return sortedParams
    ? `${prefix}:${userId}:${sortedParams}`
    : `${prefix}:${userId}`
}
