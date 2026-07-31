import { BaseRepository } from '../../core/base/base.repository';
import { EmployeeCreateInput, EmployeeUpdateInput } from './employee.types';
import { Employee } from '@prisma/client';

export class EmployeeRepository extends BaseRepository {
  async create(tenantId: string, data: EmployeeCreateInput): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        joinDate: new Date(data.joinDate),
        tenantId
      }
    });
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.employee.findUnique({
      where: { id, tenantId },
      include: {
        department: true,
        designation: true,
        branch: true,
        manager: true
      }
    });
  }

  async findByUserId(tenantId: string, userId: string) {
    return this.prisma.employee.findFirst({
      where: { userId, tenantId },
      include: {
        department: true,
        designation: true,
        branch: true,
        manager: true
      }
    });
  }

  async findByOrganizationId(tenantId: string, organizationId: string, managerId?: string): Promise<Employee[]> {
    const whereClause: any = { tenantId, organizationId };
    if (managerId) {
      whereClause.reportingTo = managerId;
    }
    return this.prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
        designation: true,
        branch: true
      }
    });
  }

  async update(tenantId: string, id: string, data: EmployeeUpdateInput): Promise<Employee> {
    const updateData: any = { ...data };
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.confirmationDate) updateData.confirmationDate = new Date(data.confirmationDate);
    if (data.resignationDate) updateData.resignationDate = new Date(data.resignationDate);
    if (data.exitDate) updateData.exitDate = new Date(data.exitDate);

    return this.prisma.employee.update({
      where: { id, tenantId },
      data: updateData
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.employee.delete({
      where: { id, tenantId }
    });
  }
}
