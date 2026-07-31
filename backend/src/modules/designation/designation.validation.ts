import { z } from 'zod';

export const createDesignationSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(100),
  level: z.number().int().positive().optional(),
  description: z.string().optional()
});

export const updateDesignationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  level: z.number().int().positive().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});
