import { Employee } from '@prisma/client';

export type EmployeeResponse = Omit<Employee, 'createdAt' | 'updatedAt'>;

export interface EmployeeCreateInput {
  organizationId: string;
  userId?: string;
  employeeCode: string;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  reportingTo?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  maritalStatus?: string;
  joinDate: Date | string;
  employmentType?: string;
  status?: string;
  role?: string;
}

export interface EmployeeUpdateInput {
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  reportingTo?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  maritalStatus?: string;
  confirmationDate?: Date | string;
  resignationDate?: Date | string;
  exitDate?: Date | string;
  employmentType?: string;
  status?: string;
}
