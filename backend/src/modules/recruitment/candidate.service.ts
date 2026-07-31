import bcrypt from 'bcryptjs';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { sendApplicationStageEmail } from '../../shared/utils/mailer';

export class CandidateService {
  async applyForJob(tenantId: string, organizationId: string, jobId: string, data: any) {
    const job = await prisma.jobOpening.findUnique({ where: { id: jobId } });
    if (!job || job.tenantId !== tenantId || job.status !== 'PUBLISHED') {
      throw new AppError('Job is not available', 404);
    }

    // Check if candidate exists (Duplicate detection)
    let candidate = await prisma.candidate.findUnique({
      where: {
        tenantId_organizationId_email: {
          tenantId,
          organizationId,
          email: data.email
        }
      }
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          tenantId,
          organizationId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          resumeUrl: data.resumeUrl,
          portfolioUrl: data.portfolioUrl,
          totalExperience: data.totalExperience,
          currentCompany: data.currentCompany,
          currentSalary: data.currentSalary,
          expectedSalary: data.expectedSalary,
          noticePeriod: data.noticePeriod
        }
      });
    }

    // Check if already applied
    const existingApp = await prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: jobId
        }
      }
    });

    if (existingApp) {
      throw new AppError('You have already applied for this job', 400);
    }

    const application = await prisma.application.create({
      data: {
        tenantId,
        organizationId,
        candidateId: candidate.id,
        jobId: jobId,
        source: data.source || 'CAREERS_PAGE'
      }
    });

    return application;
  }

  async getApplications(context: ServiceContext, organizationId: string) {
    return await prisma.jobApplication.findMany({
      where: {
        tenantId: context.tenantId
      },
      include: {
        candidate: true,
        job: true
      },
      orderBy: { appliedAt: 'desc' }
    });
  }

  async updateApplicationStage(context: ServiceContext, applicationId: string, stage: string) {
    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { stage },
      include: {
        job: true,
        candidate: true
      }
    });

    const tenant = await prisma.tenant.findUnique({ where: { id: updated.job.tenantId } });
    const tenantName = tenant ? tenant.name : 'Company';

    // Send stage update email asynchronously
    sendApplicationStageEmail(
      updated.candidate.email, 
      updated.candidate.firstName, 
      updated.job.title, 
      stage, 
      tenantName
    ).catch(e => console.error('Failed to send stage update email', e));

    return updated;
  }

  async hireCandidate(context: ServiceContext, applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: true
      }
    });

    if (!application || application.tenantId !== context.tenantId) {
      throw new AppError('Application not found', 404);
    }

    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Only HR and Admins can hire candidates', 403);
    }

    // Begin transaction to convert Candidate to Employee
    return await prisma.$transaction(async (tx) => {
      // 1. Update application stage
      await tx.application.update({
        where: { id: applicationId },
        data: { stage: 'HIRED' }
      });

      // 2. Generate generic password and hash
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      // 3. Create User account for Employee portal
      const user = await tx.user.create({
        data: {
          tenantId: application.tenantId,
          email: application.candidate.email,
          passwordHash,
          firstName: application.candidate.firstName,
          lastName: application.candidate.lastName,
          phone: application.candidate.phone,
          status: 'pending_verification'
        }
      });

      // 4. Create Employee record
      const employee = await tx.employee.create({
        data: {
          tenantId: application.tenantId,
          organizationId: application.organizationId,
          userId: user.id,
          employeeCode: `EMP-${Math.floor(Math.random() * 10000)}`,
          firstName: application.candidate.firstName,
          lastName: application.candidate.lastName,
          email: application.candidate.email,
          phone: application.candidate.phone,
          joinDate: new Date(), // Typically this comes from offer letter
          departmentId: application.job.departmentId,
          designationId: application.job.designationId,
          branchId: application.job.branchId,
          reportingTo: application.job.hiringManagerId,
          status: 'probation'
        }
      });

      // 5. Update Candidate to link to new User
      await tx.candidate.update({
        where: { id: application.candidateId },
        data: { userId: user.id, status: 'HIRED' }
      });

      // TODO: Trigger onboarding workflow generation via BullMQ or Service call

      return employee;
    });
  }
}
