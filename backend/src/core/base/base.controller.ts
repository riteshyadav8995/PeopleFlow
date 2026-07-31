import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ServiceContext } from '../interfaces/service-context.interface';

/**
 * Base controller with helpers for extracting
 * service context from authenticated requests
 * and wrapping async route handlers.
 */
export abstract class BaseController {
  /**
   * Build a ServiceContext from the authenticated request.
   */
  protected getServiceContext(req: AuthenticatedRequest): ServiceContext {
    return {
      tenantId: req.user.tenantId,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      employeeId: req.user.employeeId,
      roles: req.user.roles,
      permissions: req.user.permissions,
      requestId: req.requestId,
      highestScope: (req as any).highestScope,
    };
  }

  /**
   * Wrap an async handler to catch errors and forward them
   * to the Express error middleware.
   */
  protected asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
