import { Tenant } from '@prisma/client';

export type TenantResponse = Omit<Tenant, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};
