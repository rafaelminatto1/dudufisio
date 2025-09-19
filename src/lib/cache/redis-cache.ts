/**
 * Cache Redis para Produção
 * Implementa cache distribuído usando Redis
 */

import { Redis } from 'ioredis';

interface RedisCacheOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  ttl?: number;
  enableLogging?: boolean;
}

class RedisCache {
  private redis: Redis | null = null;
  private ttl: number;
  private enableLogging: boolean;

  constructor(options: RedisCacheOptions = {}) {
    this.ttl = options.ttl || 300; // 5 minutes default
    this.enableLogging = options.enableLogging || false;

    // Only initialize Redis if connection string is provided
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        this.redis.on('connect', () => {
          if (this.enableLogging) {
            console.log('Redis connected successfully');
          }
        });
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.redis = null;
      }
    }
  }

  /**
   * Check if Redis is available
   */
  private isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Generate cache key
   */
  private generateKey(key: string): string {
    return `fisioflow:cache:${key}`;
  }

  /**
   * Get data from Redis cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cached = await this.redis!.get(this.generateKey(key));
      
      if (!cached) {
        if (this.enableLogging) {
          console.log(`Redis cache miss: ${key}`);
        }
        return null;
      }

      if (this.enableLogging) {
        console.log(`Redis cache hit: ${key}`);
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set data in Redis cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const serialized = JSON.stringify(data);
      const cacheKey = this.generateKey(key);
      const cacheTTL = ttl || this.ttl;

      await this.redis!.setex(cacheKey, cacheTTL, serialized);

      if (this.enableLogging) {
        console.log(`Redis cache set: ${key} (TTL: ${cacheTTL}s)`);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete data from Redis cache
   */
  async delete(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.redis!.del(this.generateKey(key));

      if (this.enableLogging) {
        console.log(`Redis cache deleted: ${key}`);
      }
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const keys = await this.redis!.keys(this.generateKey(pattern));
      
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }

      if (this.enableLogging) {
        console.log(`Redis cache invalidated: ${keys.length} entries matching ${pattern}`);
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const keys = await this.redis!.keys(this.generateKey('*'));
      
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }

      if (this.enableLogging) {
        console.log(`Redis cache cleared: ${keys.length} entries`);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memory: any;
    keys: number;
  }> {
    if (!this.isAvailable()) {
      return {
        connected: false,
        memory: null,
        keys: 0,
      };
    }

    try {
      const info = await this.redis!.info('memory');
      const keys = await this.redis!.keys(this.generateKey('*'));

      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keys: keys.length,
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return {
        connected: false,
        memory: null,
        keys: 0,
      };
    }
  }

  /**
   * Parse Redis INFO output
   */
  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Create singleton instance
const redisCache = new RedisCache({
  ttl: 300, // 5 minutes
  enableLogging: process.env.NODE_ENV === 'development',
});

export default redisCache;

/**
 * Cache invalidation helpers for Redis
 */
export const redisCacheInvalidation = {
  // Invalidate all patient-related cache
  patients: () => redisCache.invalidatePattern('*patients*'),
  
  // Invalidate all appointment-related cache
  appointments: () => redisCache.invalidatePattern('*appointments*'),
  
  // Invalidate all session-related cache
  sessions: () => redisCache.invalidatePattern('*sessions*'),
  
  // Invalidate all prescription-related cache
  prescriptions: () => redisCache.invalidatePattern('*prescriptions*'),
  
  // Invalidate all exercise-related cache
  exercises: () => redisCache.invalidatePattern('*exercises*'),
  
  // Invalidate all user-related cache
  users: () => redisCache.invalidatePattern('*users*'),
  
  // Invalidate all cache
  all: () => redisCache.clear(),
};
