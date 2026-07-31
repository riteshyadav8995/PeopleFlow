import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';

export class RequisitionService {
  async createRequisition(context: ServiceContext, data: any) {
    if (!context.organizationId) {
      throw new AppError('Organization ID is required', 400);
    }

    const requisition = await prisma.jobRequisition.create({
      data: {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        title: data.title,
        departmentId: data.departmentId,
        designationId: data.designationId,
        branchId: data.branchId,
        hiringManagerId: context.employeeId || data.hiringManagerId,
        positions: data.positions || 1,
        employmentType: data.employmentType || 'full_time',
        workMode: data.workMode || 'office',
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax,
        salaryRangeMin: data.salaryRangeMin,
        salaryRangeMax: data.salaryRangeMax,
        expectedJoinDate: data.expectedJoinDate ? new Date(data.expectedJoinDate) : null,
        reason: data.reason,
        jobDescription: data.jobDescription,
        status: data.status || 'DRAFT'
      }
    });

    return requisition;
  }

  async getRequisitions(context: ServiceContext, organizationId: string) {
    // If scope is TEAM or SELF, they can only see requisitions where they are hiring manager
    const whereClause: any = {
      tenantId: context.tenantId,
      organizationId: organizationId
    };

    if (context.highestScope === 'TEAM' || context.highestScope === 'SELF') {
      whereClause.hiringManagerId = context.employeeId;
    }

    return await prisma.jobRequisition.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRequisitionById(context: ServiceContext, id: string) {
    const requisition = await prisma.jobRequisition.findUnique({
      where: { id }
    });

    if (!requisition || requisition.tenantId !== context.tenantId) {
      throw new AppError('Requisition not found', 404);
    }

    if ((context.highestScope === 'TEAM' || context.highestScope === 'SELF') && requisition.hiringManagerId !== context.employeeId) {
      throw new AppError('Unauthorized to view this requisition', 403);
    }

    return requisition;
  }

  async updateStatus(context: ServiceContext, id: string, status: string, reason?: string) {
    const requisition = await this.getRequisitionById(context, id);

    // Only HR or Org Admin can approve/reject
    if (['APPROVED', 'REJECTED'].includes(status) && context.highestScope !== 'ORGANIZATION' && context.highestScope !== 'PLATFORM') {
      throw new AppError('Unauthorized to approve/reject requisitions', 403);
    }

    const updated = await prisma.jobRequisition.update({
      where: { id },
      data: { status }
    });

    // TODO: Create Audit Log
    return updated;
  }
}
