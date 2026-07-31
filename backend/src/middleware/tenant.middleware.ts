import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../core/interfaces/authenticated-request.interface';
import { AuthenticationError } from '../core/errors/authentication.error';

/**
 * Tenant middleware — ensures the authenticated user has a valid tenant context.
 * Must run AFTER the authentication middleware.
 * Enforces BRD SEC-003: every data access must be scoped to a tenant.
 */
export function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authReq = req as AuthenticatedRequest;

  // Tenant ID should have been set by authentication middleware from the JWT
  if (!authReq.tenantId) {
    return next(new AuthenticationError('Tenant context is missing'));
  }

  next();
}
