import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../core/errors/not-found.error';

/**
 * Catch-all for routes that don't match any registered handler.
 * Must be registered AFTER all route definitions.
 */
export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Route', `${req.method} ${req.originalUrl}`));
}
