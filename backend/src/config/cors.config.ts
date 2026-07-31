import { env } from './env.validation';
import { CorsOptions } from 'cors';

export const corsConfig: CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin || env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
      if (allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
};
