export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  userId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
