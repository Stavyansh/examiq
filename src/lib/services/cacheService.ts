/**
 * Simple client-side caching service
 * Provides basic caching for API responses to improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const cache = new Map<string, CacheEntry<unknown>>();

function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Get item from cache if it exists and hasn't expired
 */
export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    // Expired, remove from cache
    cache.delete(key);
    return null;
  }

  return isNotNullish(entry.data) ? entry.data as T : null;
}

/**
 * Set item in cache with TTL
 */
export function setInCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  };

  cache.set(key, entry);

  // Optional: Log cache size for monitoring
  if (cache.size % 10 === 0) {
    console.info(`[Cache] Current cache size: ${cache.size} entries`);
  }
}

/**
 * Delete item from cache
 */
export function removeFromCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
  console.info('[Cache] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      expiresIn: Math.max(0, entry.ttl - (Date.now() - entry.timestamp))
    }))
  };
}

// Default TTL values (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 60 * 60 * 1000,  // 1 hour
  STATIC: 24 * 60 * 60 * 1000 // 24 hours
};