import { Router, Request, Response } from 'express';
import { prisma } from '../core/base/base.model';

const router = Router();

/**
 * GET /health
 * Returns server and database health status.
 */
router.get('/', async (_req: Request, res: Response) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: 'unknown' as string,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthcheck.database = 'connected';
  } catch {
    healthcheck.database = 'disconnected';
    healthcheck.status = 'degraded';
  }

  const statusCode = healthcheck.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

export default router;
