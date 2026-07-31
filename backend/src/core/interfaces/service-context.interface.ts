/**
 * Passed into every service method so that services can
 * perform tenant-scoped, user-aware operations.
 */
export interface ServiceContext {
  tenantId: string;
  userId: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  requestId: string;
  highestScope?: 'PLATFORM' | 'ORGANIZATION' | 'TEAM' | 'ASSIGNED' | 'SELF';
  employeeId?: string;
}
