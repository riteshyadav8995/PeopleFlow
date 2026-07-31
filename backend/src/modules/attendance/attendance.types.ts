import { AttendanceRecord } from '@prisma/client';

export type AttendanceResponse = Omit<AttendanceRecord, 'createdAt' | 'updatedAt'>;

export interface ClockInInput {
  organizationId: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
}

export interface ClockOutInput {
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
}
