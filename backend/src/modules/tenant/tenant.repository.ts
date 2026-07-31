import { BaseRepository } from '../../core/base/base.repository';
import { Prisma } from '@prisma/client';

export class TenantRepository extends BaseRepository {
  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.TenantUpdateInput) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
