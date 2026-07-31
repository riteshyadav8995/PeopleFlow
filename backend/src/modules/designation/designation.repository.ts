import { BaseRepository } from '../../core/base/base.repository';
import { DesignationCreateInput, DesignationUpdateInput } from './designation.types';
import { Designation } from '@prisma/client';

export class DesignationRepository extends BaseRepository {
  async create(tenantId: string, data: DesignationCreateInput): Promise<Designation> {
    return this.prisma.designation.create({
      data: {
        ...data,
        tenantId
      }
    });
  }

  async findById(tenantId: string, id: string): Promise<Designation | null> {
    return this.prisma.designation.findUnique({
      where: { id, tenantId }
    });
  }

  async findByOrganizationId(tenantId: string, organizationId: string): Promise<Designation[]> {
    return this.prisma.designation.findMany({
      where: { tenantId, organizationId }
    });
  }

  async update(tenantId: string, id: string, data: DesignationUpdateInput): Promise<Designation> {
    return this.prisma.designation.update({
      where: { id, tenantId },
      data
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.designation.delete({
      where: { id, tenantId }
    });
  }
}
