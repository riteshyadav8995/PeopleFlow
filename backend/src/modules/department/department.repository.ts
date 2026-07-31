import { BaseRepository } from '../../core/base/base.repository';
import { DepartmentCreateInput, DepartmentUpdateInput } from './department.types';
import { Department } from '@prisma/client';

export class DepartmentRepository extends BaseRepository {
  async create(tenantId: string, data: DepartmentCreateInput): Promise<Department> {
    return this.prisma.department.create({
      data: {
        ...data,
        tenantId
      }
    });
  }

  async findById(tenantId: string, id: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where: { id, tenantId }
    });
  }

  async findByOrganizationId(tenantId: string, organizationId: string): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: { tenantId, organizationId }
    });
  }

  async update(tenantId: string, id: string, data: DepartmentUpdateInput): Promise<Department> {
    return this.prisma.department.update({
      where: { id, tenantId },
      data
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.department.delete({
      where: { id, tenantId }
    });
  }
}
