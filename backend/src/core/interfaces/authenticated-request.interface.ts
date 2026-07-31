import { Request } from 'express';

/**
 * Extends Express Request with authenticated user context.
 * Populated by the authentication middleware after JWT verification.
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    tenantId: string;
    organizationId?: string;
    employeeId?: string;
    roles: string[];
    permissions: string[];
  };
  tenantId: string;
  requestId: string;
}
