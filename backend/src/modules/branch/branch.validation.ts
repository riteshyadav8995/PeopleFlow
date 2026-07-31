import { z } from 'zod';

export const createBranchSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
  address: z.record(z.string(), z.any()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  isHeadOffice: z.boolean().optional()
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(20).optional(),
  address: z.record(z.string(), z.any()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  isHeadOffice: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional()
});
