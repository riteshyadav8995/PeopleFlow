import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/logger/logger';

/**
 * Logs incoming requests and response status/timing.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;
  const requestId = (req as any).requestId || '-';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.info(`${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      requestId,
      method,
      url: originalUrl,
      statusCode,
      duration,
    });
  });

  next();
}
