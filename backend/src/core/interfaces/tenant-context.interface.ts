/**
 * Tenant context extracted from the request (JWT or header)
 * and attached to every service call to enforce data isolation.
 */
export interface TenantContext {
  tenantId: string;
  organizationId?: string;
  tenantSlug?: string;
  isActive: boolean;
}
