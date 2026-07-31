import { BaseRepository } from '../../core/base/base.repository';
import { Prisma } from '@prisma/client';
import { ParsedPagination } from '../../shared/utils/pagination.util';

export class UserRepository extends BaseRepository {
  
  async findById(tenantId: string, id: string) {
    return this.prisma.user.findUnique({
      where: { 
        id,
        tenantId,
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async findByEmail(tenantId: string, email: string) {
    return this.prisma.user.findUnique({
      where: { 
        tenantId_email: { tenantId, email }
      }
    });
  }

  async list(tenantId: string, pagination: ParsedPagination) {
    const where = this.tenantWhere(tenantId);
    
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return { data, total };
  }

  async create(data: Prisma.UserCreateInput, roleSlugs: string[]) {
    // We expect the roles to exist, service should validate this or we can do it in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });
      
      const roles = await tx.role.findMany({
        where: {
          tenantId: data.tenant?.connect?.id,
          slug: { in: roleSlugs }
        }
      });

      if (roles.length > 0) {
        await tx.userRole.createMany({
          data: roles.map(role => ({
            userId: user.id,
            roleId: role.id,
            tenantId: data.tenant?.connect?.id as string
          }))
        });
      }

      return this.findById(data.tenant?.connect?.id as string, user.id);
    });
  }

  async update(tenantId: string, id: string, data: Prisma.UserUpdateInput, roleSlugs?: string[]) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id, tenantId },
        data
      });

      if (roleSlugs) {
        // Delete old roles
        await tx.userRole.deleteMany({
          where: { userId: id, tenantId }
        });

        const roles = await tx.role.findMany({
          where: {
            tenantId,
            slug: { in: roleSlugs }
          }
        });

        if (roles.length > 0) {
          await tx.userRole.createMany({
            data: roles.map(role => ({
              userId: user.id,
              roleId: role.id,
              tenantId
            }))
          });
        }
      }

      return this.findById(tenantId, user.id);
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.user.delete({
      where: { id, tenantId }
    });
  }
}
