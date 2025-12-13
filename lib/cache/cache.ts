/**
 * Cache utility with support for Redis and in-memory caching
 * Automatically falls back to in-memory cache if Redis is unavailable
 * Supports refresh intervals for stale-while-revalidate pattern
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  refreshInterval?: number; // Refresh interval in seconds (data will be marked for refresh before TTL expires)
  namespace?: string; // Namespace prefix for cache keys
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  refreshedAt: number; // Timestamp when data was last refreshed
  refreshAt: number; // Timestamp when data should be refreshed (before expiration)
}

interface CachedValue<T> {
  data: T;
  refreshedAt: number;
  refreshAt: number;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async getWithMetadata<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  async set<T>(key: string, value: T, ttl: number, refreshInterval?: number): Promise<void> {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    const expiresAt = now + ttl * 1000;
    // If refreshInterval is set, refresh before expiration, otherwise refresh at expiration
    const refreshAt = refreshInterval 
      ? now + refreshInterval * 1000 
      : expiresAt;
    
    this.cache.set(key, { 
      data: value, 
      expiresAt,
      refreshedAt: now,
      refreshAt
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

class RedisCache {
  private client: any;
  private isConnected: boolean = false;

  constructor() {
    // Lazy initialization
  }

  private async getClient() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      // Dynamic import to handle optional dependency
      const redis = await import('redis');
      const url = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // Check if createClient exists (redis v4+)
      const createClient = (redis as any).createClient || (redis as any).default?.createClient;
      if (!createClient) {
        throw new Error('Redis client not available');
      }
      
      this.client = createClient({ url });
      
      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.warn('Redis not available, falling back to in-memory cache:', error);
      this.isConnected = false;
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      if (!client) {
        return null;
      }

      const value = await client.get(key);
      if (!value) {
        return null;
      }

      const parsed = JSON.parse(value) as CachedValue<T> | T;
      
      // Check if it's the new format with metadata
      if (parsed && typeof parsed === 'object' && 'data' in parsed && 'refreshedAt' in parsed) {
        return (parsed as CachedValue<T>).data;
      }
      
      // Legacy format - return as is
      return parsed as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async getWithMetadata<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const client = await this.getClient();
      if (!client) {
        return null;
      }

      const value = await client.get(key);
      if (!value) {
        return null;
      }

      const parsed = JSON.parse(value) as CachedValue<T> | T;
      
      // Check if it's the new format with metadata
      if (parsed && typeof parsed === 'object' && 'data' in parsed && 'refreshedAt' in parsed && 'expiresAt' in parsed) {
        const cached = parsed as CachedValue<T>;
        // Check if expired
        if (Date.now() > cached.expiresAt) {
          await this.delete(key);
          return null;
        }
        return {
          data: cached.data,
          expiresAt: cached.expiresAt,
          refreshedAt: cached.refreshedAt,
          refreshAt: cached.refreshAt,
        };
      }
      
      // Legacy format - return with estimated metadata
      const now = Date.now();
      return {
        data: parsed as T,
        expiresAt: now + 300000, // Default 5 min estimate
        refreshedAt: now,
        refreshAt: now + 300000,
      };
    } catch (error) {
      console.error('Redis getWithMetadata error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number, refreshInterval?: number): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) {
        return;
      }

      const now = Date.now();
      const expiresAt = now + ttl * 1000;
      const refreshAt = refreshInterval 
        ? now + refreshInterval * 1000 
        : expiresAt;

      // Store with metadata
      const cachedValue: CachedValue<T> = {
        data: value,
        refreshedAt: now,
        refreshAt,
        expiresAt,
      };

      const serialized = JSON.stringify(cachedValue);
      await client.setEx(key, ttl, serialized);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) {
        return;
      }

      await client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) {
        return;
      }

      await client.flushDb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return false;
      }

      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis has error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
      } catch (error) {
        console.error('Redis disconnect error:', error);
      }
    }
  }
}

class CacheManager {
  private redisCache: RedisCache;
  private memoryCache: InMemoryCache;
  private useRedis: boolean;
  private defaultTTL: number;
  private namespace: string;

  constructor(options: { useRedis?: boolean; defaultTTL?: number; namespace?: string } = {}) {
    this.useRedis = options.useRedis ?? (process.env.REDIS_URL !== undefined);
    this.defaultTTL = options.defaultTTL ?? 300; // 5 minutes default
    this.namespace = options.namespace ?? 'tokenomics';
    
    this.redisCache = new RedisCache();
    this.memoryCache = new InMemoryCache(1000);
  }

  private generateKey(key: string, namespace?: string): string {
    const ns = namespace || this.namespace;
    return `${ns}:${key}`;
  }

  /**
   * Get value from cache (tries Redis first, falls back to memory)
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.generateKey(key, options?.namespace);
    
    if (this.useRedis) {
      const value = await this.redisCache.get<T>(fullKey);
      if (value !== null) {
        // Also update memory cache for faster subsequent access
        const ttl = options?.ttl || this.defaultTTL;
        const refreshInterval = options?.refreshInterval;
        await this.memoryCache.set(fullKey, value, ttl, refreshInterval);
        return value;
      }
    }

    // Fallback to memory cache
    return await this.memoryCache.get<T>(fullKey);
  }

  /**
   * Get value from cache with refresh metadata
   * Returns null if not found or expired, otherwise returns the entry with metadata
   */
  async getWithMetadata<T>(key: string, options?: CacheOptions): Promise<CacheEntry<T> | null> {
    const fullKey = this.generateKey(key, options?.namespace);
    
    if (this.useRedis) {
      const entry = await this.redisCache.getWithMetadata<T>(fullKey);
      if (entry !== null) {
        // Also update memory cache for faster subsequent access
        const ttl = options?.ttl || this.defaultTTL;
        const refreshInterval = options?.refreshInterval;
        await this.memoryCache.set(fullKey, entry.data, ttl, refreshInterval);
        return entry;
      }
    }

    // Fallback to memory cache
    return await this.memoryCache.getWithMetadata<T>(fullKey);
  }

  /**
   * Check if cached data needs to be refreshed (stale-while-revalidate pattern)
   * Returns true if data exists but should be refreshed in the background
   */
  async needsRefresh<T>(key: string, options?: CacheOptions): Promise<boolean> {
    const entry = await this.getWithMetadata<T>(key, options);
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    // Data needs refresh if current time is past refreshAt but before expiresAt
    return now >= entry.refreshAt && now < entry.expiresAt;
  }

  /**
   * Set value in cache (writes to both Redis and memory if available)
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.generateKey(key, options?.namespace);
    const ttl = options?.ttl || this.defaultTTL;
    const refreshInterval = options?.refreshInterval;

    // Write to memory cache (always available)
    await this.memoryCache.set(fullKey, value, ttl, refreshInterval);

    // Write to Redis if available
    if (this.useRedis) {
      await this.redisCache.set(fullKey, value, ttl, refreshInterval);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const fullKey = this.generateKey(key, options?.namespace);
    
    await Promise.all([
      this.memoryCache.delete(fullKey),
      this.redisCache.delete(fullKey),
    ]);
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.generateKey(key, options?.namespace);
    
    if (this.useRedis) {
      const exists = await this.redisCache.has(fullKey);
      if (exists) {
        return true;
      }
    }

    return await this.memoryCache.has(fullKey);
  }

  /**
   * Clear all cache entries (use with caution)
   */
  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      // For namespace clearing, we'd need to implement pattern matching
      // This is a simplified version
      console.warn('Namespace clearing not fully implemented, clearing all cache');
    }
    
    await Promise.all([
      this.memoryCache.clear(),
      this.redisCache.clear(),
    ]);
  }

  /**
   * Generate a cache key from parameters
   */
  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Disconnect from Redis (call on app shutdown)
   */
  async disconnect(): Promise<void> {
    await this.redisCache.disconnect();
  }
}

// Export singleton instance
let cacheInstance: CacheManager | null = null;

export function getCache(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager({
      useRedis: process.env.USE_REDIS === 'true' || process.env.REDIS_URL !== undefined,
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10),
      namespace: process.env.CACHE_NAMESPACE || 'tokenomics',
    });
  }
  return cacheInstance;
}

// Export types and classes for advanced usage
export { CacheManager, InMemoryCache, RedisCache };
export type { CacheOptions };

