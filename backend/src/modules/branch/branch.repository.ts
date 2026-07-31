import { BaseRepository } from '../../core/base/base.repository';
import { BranchCreateInput, BranchUpdateInput } from './branch.types';
import { Branch } from '@prisma/client';

export class BranchRepository extends BaseRepository {
  async create(tenantId: string, data: BranchCreateInput): Promise<Branch> {
    return this.prisma.branch.create({
      data: {
        ...data,
        tenantId
      }
    });
  }

  async findById(tenantId: string, id: string): Promise<Branch | null> {
    return this.prisma.branch.findUnique({
      where: {
        id,
        tenantId
      }
    });
  }

  async findByOrganizationId(tenantId: string, organizationId: string): Promise<Branch[]> {
    return this.prisma.branch.findMany({
      where: {
        tenantId,
        organizationId
      }
    });
  }

  async update(tenantId: string, id: string, data: BranchUpdateInput): Promise<Branch> {
    return this.prisma.branch.update({
      where: { id, tenantId },
      data
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.branch.delete({
      where: { id, tenantId }
    });
  }
}
