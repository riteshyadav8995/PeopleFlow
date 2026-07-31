import { ServiceContext } from '../interfaces/service-context.interface';

/**
 * Base service class providing common patterns for
 * tenant-scoped, context-aware service operations.
 */
export abstract class BaseService {
  /**
   * Extract tenant ID from the service context.
   * Throws if context is missing (should never happen
   * if middleware is properly configured).
   */
  protected getTenantId(context: ServiceContext): string {
    if (!context.tenantId) {
      throw new Error('Tenant context is required');
    }
    return context.tenantId;
  }

  /**
   * Extract user ID from the service context.
   */
  protected getUserId(context: ServiceContext): string {
    if (!context.userId) {
      throw new Error('User context is required');
    }
    return context.userId;
  }
}
