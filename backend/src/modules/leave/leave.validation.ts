import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  organizationId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  reason: z.string().min(5)
});

export const approveLeaveRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional()
});

export const createLeavePolicySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  daysPerYear: z.number().min(0),
  isPaid: z.boolean().default(true)
});
