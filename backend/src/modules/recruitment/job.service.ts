import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';

export class JobService {
  async createJob(context: ServiceContext, data: any) {
    const orgId = context.organizationId || data.organizationId;
    if (!orgId) {
      throw new AppError('Organization ID is required', 400);
    }

    const jobCode = data.jobCode || `JOB-${Math.floor(Math.random() * 10000)}`;

    const job = await prisma.jobPosting.create({
      data: {
        tenantId: context.tenantId,
        organizationId: orgId,
        jobCode: jobCode,
        title: data.title,
        positions: data.positions || 1,
        employmentType: data.employmentType || 'FULL_TIME',
        workMode: data.workMode || 'ONSITE',
        experienceMin: data.experienceMin || 0,
        experienceMax: data.experienceMax || 0,
        publicDescription: data.publicDescription,
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
        status: data.status || 'DRAFT'
      }
    });

    if (job.status === 'PUBLISHED') {
      const candidates = await prisma.candidate.findMany({
        where: { tenantId: context.tenantId, organizationId: orgId, userId: { not: null } }
      });

      if (candidates.length > 0) {
        const notifications = candidates.map(c => ({
          tenantId: context.tenantId,
          organizationId: orgId,
          userId: c.userId as string,
          title: 'New Job Posted!',
          message: `A new job "${job.title}" has been posted. Apply now!`,
          type: 'INFO',
          link: `/jobs/${job.id}`
        }));
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return job;
  }

  async getJobs(context: ServiceContext, organizationId: string) {
    return await prisma.jobPosting.findMany({
      where: {
        tenantId: context.tenantId,
        organizationId: organizationId
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateJob(context: ServiceContext, id: string, data: any) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job || job.tenantId !== context.tenantId) {
      throw new AppError('Job not found', 404);
    }

    return await prisma.jobPosting.update({
      where: { id },
      data: {
        title: data.title,
        positions: data.positions,
        employmentType: data.employmentType,
        workMode: data.workMode,
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax,
        publicDescription: data.publicDescription,
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
        status: data.status
      }
    });
  }

  async deleteJob(context: ServiceContext, id: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job || job.tenantId !== context.tenantId) {
      throw new AppError('Job not found', 404);
    }

    await prisma.jobPosting.delete({ where: { id } });
    return { success: true };
  }

  async getPublicJobs(tenantId: string, organizationId: string) {
    return await prisma.jobOpening.findMany({
      where: {
        tenantId,
        organizationId,
        status: 'PUBLISHED'
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        jobCode: true,
        title: true,
        employmentType: true,
        workMode: true,
        experienceMin: true,
        experienceMax: true,
        publicDescription: true,
        applicationDeadline: true,
        createdAt: true
      }
    });
  }

  async updateJobStatus(context: ServiceContext, id: string, status: string) {
    const job = await prisma.jobOpening.findUnique({ where: { id } });
    if (!job || job.tenantId !== context.tenantId) {
      throw new AppError('Job not found', 404);
    }

    if ((context.highestScope === 'TEAM' || context.highestScope === 'SELF') && job.recruiterId !== context.employeeId) {
      throw new AppError('Unauthorized to update this job', 403);
    }

    const updated = await prisma.jobOpening.update({
      where: { id },
      data: { status }
    });

    return updated;
  }
}
