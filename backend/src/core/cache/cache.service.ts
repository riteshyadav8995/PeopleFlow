import Redis from 'ioredis';
import { env } from '../../config/env.validation';

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();

  constructor() {
    if (env.REDIS_URL) {
      console.log('🔌 Initializing Redis Cache...');
      
      const isUpstash = env.REDIS_URL.includes('upstash');
      const isSecure = env.REDIS_URL.startsWith('rediss://') || isUpstash;

      this.redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        tls: isSecure ? { rejectUnauthorized: false } : undefined,
        retryStrategy(times) {
          console.warn(`Redis retry attempt ${times}`);
          if (times > 3) return null; // stop retrying
          return Math.min(times * 50, 2000);
        },
      });

      this.redis.on('error', (err) => {
        console.error('Redis Connection Error:', err.message);
      });
      
      this.redis.on('connect', () => {
        console.log('✅ Connected to Redis successfully!');
      });
    } else {
      console.warn('⚠️ No REDIS_URL found. Falling back to In-Memory Cache for local development.');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        return await this.redis.get(key);
      } catch (err) {
        console.error(`Redis Get Error for ${key}:`, err);
        return null;
      }
    }

    // In-memory fallback
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.set(key, value, 'EX', ttlSeconds);
        return;
      } catch (err) {
        console.error(`Redis Set Error for ${key}:`, err);
      }
    }

    // In-memory fallback
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.del(key);
        return;
      } catch (err) {
        console.error(`Redis Del Error for ${key}:`, err);
      }
    }

    // In-memory fallback
    this.memoryCache.delete(key);
  }
}

export const cacheService = new CacheService();
