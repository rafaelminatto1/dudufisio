import logger from '../../../lib/logger';

/**
 * Advanced Caching Strategies
 * Implements intelligent caching for different resource types
 */

// Cache configuration
export const CACHE_CONFIG = {
  STATIC_CACHE: 'fisioflow-static-v1',
  API_CACHE: 'fisioflow-api-v1',
  IMAGE_CACHE: 'fisioflow-images-v1',
  TTL: {
    STATIC: 24 * 60 * 60 * 1000, // 24 hours
    API: 5 * 60 * 1000, // 5 minutes
    IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
    USER_DATA: 1 * 60 * 1000 // 1 minute
  }
} as const

// Cache entry interface
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

class AdvancedCache {
  private memoryCache = new Map<string, CacheEntry>()
  private readonly maxMemorySize = 100 // Max items in memory

  // In-memory cache with TTL
  set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.TTL.API): void {
    // Clean up expired entries if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.cleanupExpired()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    }

    this.memoryCache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)

    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.memoryCache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.memoryCache.delete(key)
  }

  clear(): void {
    this.memoryCache.clear()
  }

  private cleanupExpired(): void {
    const now = Date.now()

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const entry of this.memoryCache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.memoryCache.size,
      active,
      expired,
      memoryUsage: this.memoryCache.size / this.maxMemorySize
    }
  }
}

// Singleton cache instance
export const cache = new AdvancedCache()

// Service Worker cache utilities (for client-side)
export class ServiceWorkerCache {
  private static isSupported(): boolean {
    return typeof window !== 'undefined' && 'caches' in window
  }

  static async cacheStaticAssets(urls: string[]): Promise<void> {
    if (!this.isSupported()) return

    try {
      const cache = await caches.open(CACHE_CONFIG.STATIC_CACHE)
      await cache.addAll(urls)
    } catch (error) {
      logger.warn('Failed to cache static assets:', error)
    }
  }

  static async cacheAPIResponse(request: Request, response: Response): Promise<void> {
    if (!this.isSupported()) return

    try {
      const cache = await caches.open(CACHE_CONFIG.API_CACHE)
      await cache.put(request, response.clone())
    } catch (error) {
      logger.warn('Failed to cache API response:', error)
    }
  }

  static async getCachedResponse(request: Request): Promise<Response | undefined> {
    if (!this.isSupported()) return undefined

    try {
      const cache = await caches.open(CACHE_CONFIG.API_CACHE)
      return await cache.match(request)
    } catch (error) {
      logger.warn('Failed to get cached response:', error)
      return undefined
    }
  }

  static async clearExpiredCache(): Promise<void> {
    if (!this.isSupported()) return

    try {
      const cacheNames = await caches.keys()
      const deletePromises = cacheNames
        .filter(name => name.includes('fisioflow-') && !name.includes('-v1'))
        .map(name => caches.delete(name))

      await Promise.all(deletePromises)
    } catch (error) {
      logger.warn('Failed to clear expired cache:', error)
    }
  }
}

// API response caching decorator
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  getCacheKey: (...args: T) => string,
  ttl: number = CACHE_CONFIG.TTL.API
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = getCacheKey(...args)

    // Try to get from cache first
    const cached = cache.get<R>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn(...args)
    cache.set(cacheKey, result, ttl)

    return result
  }
}

// React Query-like stale while revalidate
export function useSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    revalidateOnFocus?: boolean
    revalidateInterval?: number
  } = {}
) {
  const {
    ttl = CACHE_CONFIG.TTL.API,
    revalidateOnFocus = true,
    revalidateInterval
  } = options

  // Get cached data immediately
  const cached = cache.get<T>(key)

  // Background revalidation
  const revalidate = async () => {
    try {
      const fresh = await fetcher()
      cache.set(key, fresh, ttl)
      return fresh
    } catch (error) {
      logger.warn('Revalidation failed for key:', key, error)
      return cached
    }
  }

  // Revalidate on focus
  if (revalidateOnFocus && typeof window !== 'undefined') {
    window.addEventListener('focus', revalidate, { once: true })
  }

  // Revalidate on interval
  if (revalidateInterval) {
    setInterval(revalidate, revalidateInterval)
  }

  return {
    data: cached,
    revalidate,
    isStale: !cache.has(key)
  }
}

// Cache invalidation patterns
export const cacheInvalidation = {
  // Invalidate patient-related caches
  invalidatePatient: (patientId: string) => {
    const patterns = [
      `patient:${patientId}`,
      `patient:${patientId}:sessions`,
      `patient:${patientId}:appointments`,
      `patient:${patientId}:prescriptions`,
      'patients:list'
    ]

    patterns.forEach(pattern => cache.delete(pattern))
  },

  // Invalidate appointment-related caches
  invalidateAppointments: (date?: string) => {
    const patterns = [
      'appointments:list',
      'appointments:today',
      'appointments:upcoming'
    ]

    if (date) {
      patterns.push(`appointments:date:${date}`)
    }

    patterns.forEach(pattern => cache.delete(pattern))
  },

  // Invalidate exercise-related caches
  invalidateExercises: () => {
    const patterns = [
      'exercises:list',
      'exercises:categories',
      'prescriptions:list'
    ]

    patterns.forEach(pattern => cache.delete(pattern))
  },

  // Clear all caches
  clearAll: () => {
    cache.clear()
  }
}