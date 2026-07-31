import { PrismaClient } from '@prisma/client';
import { AuditEntry } from '../../core/interfaces/audit.interface';
import { logger } from './logger';

/**
 * Audit logger writes structured audit entries to the audit_logs table.
 * Used by the audit middleware and can be called directly from services.
 */
export class AuditLogger {
  constructor(private prisma: PrismaClient) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          oldValues: entry.oldValues ? (entry.oldValues as any) : undefined,
          newValues: entry.newValues ? (entry.newValues as any) : undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata ? (entry.metadata as any) : undefined,
        },
      });
    } catch (error) {
      // Audit logging should never crash the request
      logger.error('Failed to write audit log', {
        error: (error as Error).message,
        entityType: entry.entityType,
        entityId: entry.entityId,
      });
    }
  }
}
