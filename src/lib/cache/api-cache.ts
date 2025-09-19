/**
 * Sistema de Cache para APIs
 * Implementa cache em memória com TTL e invalidação automática
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  enableLogging?: boolean;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private enableLogging: boolean;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.enableLogging = options.enableLogging || false;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Generate cache key from URL and options
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict oldest entries if cache is full
   */
  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get data from cache
   */
  get<T>(url: string, options?: RequestInit): T | null {
    const key = this.generateKey(url, options);
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.enableLogging) {
        console.log(`Cache miss: ${key}`);
      }
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      if (this.enableLogging) {
        console.log(`Cache expired: ${key}`);
      }
      return null;
    }

    if (this.enableLogging) {
      console.log(`Cache hit: ${key}`);
    }
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(url: string, data: T, options?: RequestInit & { ttl?: number }): void {
    const key = this.generateKey(url, options);
    const ttl = options?.ttl || this.defaultTTL;

    // Clean expired entries periodically
    if (Math.random() < 0.1) { // 10% chance
      this.cleanExpired();
    }

    // Evict oldest if cache is full
    this.evictOldest();

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    if (this.enableLogging) {
      console.log(`Cache set: ${key} (TTL: ${ttl}ms)`);
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (this.enableLogging) {
      console.log(`Cache invalidated: ${count} entries matching ${pattern}`);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    if (this.enableLogging) {
      console.log('Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for this
      entries,
    };
  }
}

// Create singleton instance
const apiCache = new APICache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  enableLogging: process.env.NODE_ENV === 'development',
});

export default apiCache;

/**
 * Cached fetch function
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { ttl?: number }
): Promise<T> {
  // Check cache first
  const cached = apiCache.get<T>(url, options);
  if (cached) {
    return cached;
  }

  // Fetch from network
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Cache the result
  apiCache.set(url, data, options);

  return data;
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate all patient-related cache
  patients: () => apiCache.invalidate('.*patients.*'),
  
  // Invalidate all appointment-related cache
  appointments: () => apiCache.invalidate('.*appointments.*'),
  
  // Invalidate all session-related cache
  sessions: () => apiCache.invalidate('.*sessions.*'),
  
  // Invalidate all prescription-related cache
  prescriptions: () => apiCache.invalidate('.*prescriptions.*'),
  
  // Invalidate all exercise-related cache
  exercises: () => apiCache.invalidate('.*exercises.*'),
  
  // Invalidate all user-related cache
  users: () => apiCache.invalidate('.*users.*'),
  
  // Invalidate all cache
  all: () => apiCache.clear(),
};
