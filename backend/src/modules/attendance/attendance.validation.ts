import { z } from 'zod';

export const clockInSchema = z.object({
  organizationId: z.string().uuid(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const clockOutSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional()
});
