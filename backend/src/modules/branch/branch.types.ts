import { Branch } from '@prisma/client';

export type BranchResponse = Omit<Branch, 'createdAt' | 'updatedAt'>;

export interface BranchCreateInput {
  organizationId: string;
  name: string;
  code?: string;
  address?: Record<string, any>;
  phone?: string;
  email?: string;
  isHeadOffice?: boolean;
}

export interface BranchUpdateInput {
  name?: string;
  code?: string;
  address?: Record<string, any>;
  phone?: string;
  email?: string;
  isHeadOffice?: boolean;
  status?: string;
}
