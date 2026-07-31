import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { prisma } from '../../core/base/base.model';

export class ReimbursementService extends BaseService {
  async submitClaim(context: ServiceContext, organizationId: string, data: any) {
    const tenantId = this.getTenantId(context);
    const employee = await prisma.employee.findFirst({
      where: { tenantId, userId: context.userId }
    });

    if (!employee) throw new NotFoundError('Employee not found');

    return prisma.reimbursementClaim.create({
      data: {
        tenantId,
        organizationId,
        employeeId: employee.id,
        category: data.category,
        amount: Number(data.amount),
        date: new Date(data.date),
        notes: data.notes,
        status: 'PENDING'
      }
    });
  }

  async getMyClaims(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const employee = await prisma.employee.findFirst({
      where: { tenantId, userId: context.userId }
    });

    if (!employee) throw new NotFoundError('Employee not found');

    return prisma.reimbursementClaim.findMany({
      where: { tenantId, organizationId, employeeId: employee.id },
      orderBy: { date: 'desc' }
    });
  }

  async getTeamClaims(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    return prisma.reimbursementClaim.findMany({
      where: {
        tenantId,
        organizationId,
        employee: {
          reportingTo: context.employeeId
        }
      },
      include: { employee: true },
      orderBy: { date: 'desc' }
    });
  }

  async getAllClaims(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    return prisma.reimbursementClaim.findMany({
      where: { tenantId, organizationId },
      include: { employee: true },
      orderBy: { date: 'desc' }
    });
  }

  async updateClaimStatus(context: ServiceContext, claimId: string, status: string, notes?: string) {
    const tenantId = this.getTenantId(context);
    const data: any = { status };
    
    if (status === 'REJECTED' && notes) {
      data.rejectionReason = notes;
    }
    if (status === 'PAID') {
      data.paidOn = new Date();
    }

    return prisma.reimbursementClaim.update({
      where: { id: claimId, tenantId },
      data
    });
  }
}
