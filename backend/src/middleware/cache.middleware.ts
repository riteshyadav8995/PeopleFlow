import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../core/cache/cache.service';
import { env } from '../config/env.validation';

export const cacheResponse = (ttlSeconds: number = 30) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not configured or in certain environments
    if (!env.REDIS_URL) {
      return next();
    }

    // Attempt to extract context for safe per-user caching
    // auth.middleware populates req.user / req.tenantId if present
    const authReq = req as any;
    const tenantId = authReq.tenantId || 'global';
    const userId = authReq.user?.userId || 'guest';
    
    // Create a unique key: tenant + user + url
    const cacheKey = `cache:${tenantId}:${userId}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        // Return cached response instantly
        res.set('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        res.send(cachedData);
        return;
      }

      res.set('X-Cache', 'MISS');

      // Hijack the res.send to capture the response body
      const originalSend = res.send.bind(res);
      
      res.send = (body: any) => {
        // Only cache successful JSON responses
        if (res.statusCode >= 200 && res.statusCode < 300 && typeof body === 'string') {
          // Fire and forget caching to not block the response
          cacheService.set(cacheKey, body, ttlSeconds).catch(err => {
            console.error('Failed to set cache in middleware', err);
          });
        } else if (typeof body === 'object') {
          cacheService.set(cacheKey, JSON.stringify(body), ttlSeconds).catch(() => {});
        }
        
        return originalSend(body);
      };

      next();
    } catch (err) {
      // If cache fails, just continue as normal
      console.error('Cache Middleware Error:', err);
      next();
    }
  };
};
