import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../core/interfaces/authenticated-request.interface';
import { AuthorizationError } from '../core/errors/authorization.error';

/**
 * Authorization middleware factory — checks if the authenticated user
 * has the required permissions to access the resource.
 *
 * Usage:
 *   router.get('/employees', authorize('employee:read'), controller.list);
 */
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return next(new AuthorizationError('User context is missing'));
    }

    // Strict RBAC Rule: Super Admins DO NOT bypass organization-level permission checks.
    // They must explicitly impersonate or hold a valid role within the tenant.
    
    // Tenant Admins, Org Admins, and HR Managers have full administrative access to their tenant
    const isTenantAdmin = authReq.user.roles.includes('tenant_admin') || 
                          authReq.user.roles.includes('organization_admin') ||
                          authReq.user.roles.includes('hr_manager');

    const hasPermission = requiredPermissions.every((perm) =>
      authReq.user.permissions.includes(perm),
    );

    if (!hasPermission && !isTenantAdmin) {
      return next(
        new AuthorizationError(
          `Missing required permissions: ${requiredPermissions.join(', ')}`,
        ),
      );
    }

    // Calculate highestScope based on roles
    let highestScope: 'PLATFORM' | 'ORGANIZATION' | 'TEAM' | 'ASSIGNED' | 'SELF' = 'SELF';
    if (authReq.user.roles.includes('super_admin')) {
      highestScope = 'PLATFORM';
    } else if (authReq.user.roles.includes('tenant_admin') || authReq.user.roles.includes('organization_admin')) {
      highestScope = 'ORGANIZATION';
    } else if (authReq.user.roles.includes('manager')) {
      highestScope = 'TEAM';
    } else if (authReq.user.roles.includes('project_manager') || authReq.user.roles.includes('team_lead')) {
      highestScope = 'ASSIGNED';
    }

    (req as any).highestScope = highestScope;

    next();
  };
}

export function requireRoles(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return next(new AuthorizationError('User context is missing'));
    }

    const hasRole = roles.some((role) => authReq.user.roles.includes(role));

    if (!hasRole) {
      return next(new AuthorizationError(`Requires one of roles: ${roles.join(', ')}`));
    }

    next();
  };
}
