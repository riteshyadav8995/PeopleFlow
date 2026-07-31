import { Designation } from '@prisma/client';

export type DesignationResponse = Omit<Designation, 'createdAt' | 'updatedAt'>;

export interface DesignationCreateInput {
  organizationId: string;
  title: string;
  level?: number;
  description?: string;
}

export interface DesignationUpdateInput {
  title?: string;
  level?: number;
  description?: string;
  status?: string;
}
