import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { prisma } from '../../core/base/base.model';

export class PerformanceService {
  // --- GOALS ---
  async getTeamGoals(context: ServiceContext) {
    return await prisma.goal.findMany({
      where: {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        employee: {
          reportingTo: context.employeeId
        }
      },
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createGoal(context: ServiceContext, data: any) {
    return await prisma.goal.create({
      data: {
        tenantId: context.tenantId,
        organizationId: context.organizationId!,
        employeeId: data.employeeId,
        title: data.title,
        dueDate: new Date(data.dueDate),
        status: 'not_started',
      }
    });
  }

  async deleteGoal(context: ServiceContext, goalId: string) {
    return await prisma.goal.delete({ where: { id: goalId } });
  }

  // --- FEEDBACK ---
  async getTeamFeedback(context: ServiceContext) {
    return await prisma.feedback.findMany({
      where: {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        reviewerId: context.employeeId!
      },
      include: { employee: true, reviewer: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createFeedback(context: ServiceContext, data: any) {
    return await prisma.feedback.create({
      data: {
        tenantId: context.tenantId,
        organizationId: context.organizationId!,
        reviewerId: context.employeeId!,
        employeeId: data.employeeId,
        content: data.message,
        rating: data.type === 'praise' ? 5 : 3
      }
    });
  }

  async deleteFeedback(context: ServiceContext, feedbackId: string) {
    return await prisma.feedback.delete({ where: { id: feedbackId } });
  }

  // --- ONE ON ONE MEETINGS ---
  async getTeamMeetings(context: ServiceContext) {
    return await prisma.meeting.findMany({
      where: {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        organizerId: context.employeeId!
      },
      orderBy: { startTime: 'desc' }
    });
  }

  async createMeeting(context: ServiceContext, data: any) {
    const [hours, minutes] = data.time.split(':');
    const startTime = new Date(data.date);
    startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    return await prisma.meeting.create({
      data: {
        tenantId: context.tenantId,
        organizationId: context.organizationId!,
        organizerId: context.employeeId!,
        title: data.type,
        startTime,
        endTime,
        attendees: [data.employeeId],
        status: 'upcoming'
      }
    });
  }

  async completeMeeting(context: ServiceContext, meetingId: string) {
    return await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'completed' }
    });
  }
}
