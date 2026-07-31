import { z } from 'zod';

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  domain: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  theme: z.record(z.string(), z.string()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
