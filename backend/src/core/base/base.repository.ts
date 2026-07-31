import { PrismaClient } from '@prisma/client';
import { prisma } from './base.model';

/**
 * Base repository that all module repositories extend.
 * Provides access to the tenant-aware Prisma client
 * and common CRUD helper methods.
 */
export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Helper to build a tenant-scoped where clause.
   */
  protected tenantWhere(tenantId: string, additionalWhere: Record<string, unknown> = {}) {
    return {
      tenantId,
      ...additionalWhere,
    };
  }
}
