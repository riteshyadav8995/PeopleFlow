import { Department } from '@prisma/client';

export type DepartmentResponse = Omit<Department, 'createdAt' | 'updatedAt'>;

export interface DepartmentCreateInput {
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  headId?: string;
}

export interface DepartmentUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
  headId?: string;
  status?: string;
}
