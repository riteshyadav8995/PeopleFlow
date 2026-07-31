import { LeaveType, LeaveBalance, LeaveRequest } from '@prisma/client';

export interface CreateLeaveRequestInput {
  organizationId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveRequestResponse extends Omit<LeaveRequest, 'createdAt' | 'updatedAt'> {
  leaveType?: Pick<LeaveType, 'name' | 'code'>;
  employee?: { firstName: string; lastName: string };
}
