import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { sendOnboardingWelcomeEmail } from '../../shared/utils/mailer';
import { env } from '../../config/env.validation';
import { logger } from '../../shared/logger/logger';

export class WorkflowService {
  async assignWorkflow(context: ServiceContext, data: { employeeId: string, templateId: string }) {
    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to assign workflows', 403);
    }

    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee || employee.tenantId !== context.tenantId) {
      throw new AppError('Employee not found', 404);
    }

    const template = await prisma.onboardingTemplate.findUnique({
      where: { id: data.templateId },
      include: { tasks: true }
    });

    if (!template || template.tenantId !== context.tenantId) {
      throw new AppError('Template not found', 404);
    }

    const createdTasks: { title: string; category: string; dueDate: Date }[] = [];

    const workflow = await prisma.$transaction(async (tx) => {
      const wf = await tx.onboardingWorkflow.create({
        data: {
          tenantId: context.tenantId,
          organizationId: employee.organizationId,
          employeeId: employee.id,
          templateId: template.id,
          status: 'IN_PROGRESS'
        }
      });

      // Create instances of tasks
      for (const t of template.tasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + t.dueDaysOffset);

        let assigneeId = null;
        if (t.category === 'EMPLOYEE') assigneeId = employee.id;
        else if (t.category === 'MANAGER') assigneeId = employee.reportingTo;

        await tx.onboardingTask.create({
          data: {
            workflowId: wf.id,
            title: t.title,
            category: t.category,
            isMandatory: t.isMandatory,
            dueDate: dueDate,
            assigneeId: assigneeId,
            status: 'PENDING'
          }
        });

        createdTasks.push({ title: t.title, category: t.category, dueDate });
      }

      return wf;
    });

    // Send onboarding welcome email to the employee
    try {
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      const frontendUrl = env.FRONTEND_URL;
      const dashboardUrl = `${frontendUrl}/organization/onboarding`;

      if (employee.email) {
        await sendOnboardingWelcomeEmail(
          employee.email,
          employeeName,
          template.name,
          createdTasks,
          dashboardUrl
        );
      } else {
        logger.warn(`No email found for employee ${employee.id}, skipping onboarding email`);
      }
    } catch (emailError) {
      // Don't fail the workflow creation if email sending fails
      logger.error('Failed to send onboarding welcome email', { error: emailError });
    }

    return workflow;
  }

  async getMyTasks(context: ServiceContext) {
    // Admins/HR may not have an employeeId — return empty array gracefully
    if (!context.employeeId) {
      return [];
    }

    return await prisma.onboardingTask.findMany({
      where: {
        assigneeId: context.employeeId,
        workflow: {
          tenantId: context.tenantId
        }
      },
      include: {
        workflow: {
          include: {
            template: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async completeTask(context: ServiceContext, taskId: string) {
    if (!context.employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const task = await prisma.onboardingTask.findUnique({
      where: { id: taskId },
      include: { workflow: true }
    });

    if (!task || task.workflow.tenantId !== context.tenantId) {
      throw new AppError('Task not found', 404);
    }

    if (task.assigneeId && task.assigneeId !== context.employeeId && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to complete this task', 403);
    }

    const updated = await prisma.onboardingTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Check if all tasks in workflow are completed
    const pendingTasks = await prisma.onboardingTask.count({
      where: {
        workflowId: task.workflowId,
        isMandatory: true,
        status: { not: 'COMPLETED' }
      }
    });

    if (pendingTasks === 0) {
      await prisma.onboardingWorkflow.update({
        where: { id: task.workflowId },
        data: { status: 'COMPLETED' }
      });
    }

    return updated;
  }

  async getWorkflows(context: ServiceContext, organizationId: string) {
    return await prisma.onboardingWorkflow.findMany({
      where: {
        tenantId: context.tenantId,
        ...(organizationId && { organizationId })
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } }
          }
        },
        template: { select: { name: true } },
        tasks: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
