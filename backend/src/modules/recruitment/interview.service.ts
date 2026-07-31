import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';

export class InterviewService {
  async scheduleInterview(context: ServiceContext, data: any) {
    if (!context.organizationId) {
      throw new AppError('Organization ID is required', 400);
    }

    const application = await prisma.application.findUnique({
      where: { id: data.applicationId }
    });

    if (!application || application.tenantId !== context.tenantId) {
      throw new AppError('Application not found', 404);
    }

    const interview = await prisma.interview.create({
      data: {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        candidateId: application.candidateId,
        applicationId: application.id,
        jobId: application.jobId,
        roundName: data.roundName,
        interviewType: data.interviewType,
        interviewMode: data.interviewMode,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        meetingLink: data.meetingLink,
        status: 'SCHEDULED'
      }
    });

    // Create feedback record for interviewer
    if (data.interviewerId) {
      await prisma.interviewFeedback.create({
        data: {
          tenantId: context.tenantId,
          interviewId: interview.id,
          interviewerId: data.interviewerId
        }
      });
    }

    return interview;
  }

  async getInterviews(context: ServiceContext, organizationId: string) {
    const whereClause: any = {
      tenantId: context.tenantId,
      organizationId: organizationId
    };

    if (context.highestScope === 'TEAM' || context.highestScope === 'SELF') {
      // If team/self, they can only see interviews assigned to them
      whereClause.feedback = {
        some: { interviewerId: context.employeeId }
      };
    }

    return await prisma.interview.findMany({
      where: whereClause,
      include: {
        candidate: true,
        job: true,
        feedback: true
      },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  async submitFeedback(context: ServiceContext, interviewId: string, data: any) {
    if (!context.employeeId) {
      throw new AppError('Employee ID required to submit feedback', 400);
    }

    const feedback = await prisma.interviewFeedback.findUnique({
      where: {
        interviewId_interviewerId: {
          interviewId: interviewId,
          interviewerId: context.employeeId
        }
      }
    });

    if (!feedback) {
      throw new AppError('You are not assigned as an interviewer for this interview', 403);
    }

    if (feedback.status === 'SUBMITTED') {
      throw new AppError('Feedback already submitted and cannot be edited', 400);
    }

    const updated = await prisma.interviewFeedback.update({
      where: { id: feedback.id },
      data: {
        rating: data.rating,
        recommendation: data.recommendation,
        feedback: data.feedback,
        status: 'SUBMITTED'
      }
    });

    // Check if all feedbacks are submitted, optionally mark interview as COMPLETED
    const allFeedbacks = await prisma.interviewFeedback.findMany({
      where: { interviewId }
    });

    if (allFeedbacks.every(f => f.id === updated.id ? true : f.status === 'SUBMITTED')) {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'COMPLETED' }
      });
    }

    return updated;
  }
}
