import { z } from 'zod';

export const createEmployeeSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  employeeCode: z.string().min(1).max(50),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  reportingTo: z.string().uuid().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  joinDate: z.string().datetime(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  status: z.enum(['active', 'probation', 'on_notice', 'terminated', 'resigned']).optional(),
  role: z.string().optional()
});

export const updateEmployeeSchema = z.object({
  departmentId: z.string().uuid().nullable().optional(),
  designationId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  reportingTo: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  gender: z.string().nullable().optional(),
  maritalStatus: z.string().nullable().optional(),
  confirmationDate: z.string().datetime().nullable().optional(),
  resignationDate: z.string().datetime().nullable().optional(),
  exitDate: z.string().datetime().nullable().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  status: z.enum(['active', 'probation', 'on_notice', 'terminated', 'resigned']).optional()
});
