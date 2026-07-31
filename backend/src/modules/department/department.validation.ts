import { z } from 'zod';

export const createDepartmentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  headId: z.string().uuid().optional()
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(20).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  headId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive']).optional()
});
