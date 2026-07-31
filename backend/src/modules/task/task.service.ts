import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { emailService } from '../../integrations/email/email.service';

export class TaskService extends BaseService {
  
  async createTask(context: ServiceContext, data: any) {
    // Requires task.record.create
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return await prisma.task.create({
      data: {
        tenantId: context.tenantId,
        organizationId: context.organizationId || project.organizationId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status || 'BACKLOG',
        priority: data.priority || 'MEDIUM',
        estimatedHours: data.estimatedHours,
        assigneeId: data.assigneeId,
        reporterId: context.employeeId || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });
  }

  async getTasks(context: ServiceContext, projectId?: string, managerId?: string) {
    let whereClause: any = { tenantId: context.tenantId };
    
    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (managerId) {
      // If managerId is passed, fetch tasks assigned to employees reporting to this manager
      whereClause.assignee = {
        reportingTo: managerId
      };
    } else if (['ASSIGNED', 'TEAM', 'SELF'].includes(context.highestScope || '')) {
      whereClause.OR = [
        { assigneeId: context.employeeId },
        { reporterId: context.employeeId }
      ];
      if (context.highestScope === 'TEAM' && context.employeeId) {
        whereClause.OR.push({ assignee: { reportingTo: context.employeeId } });
      }
    } else if (context.highestScope !== 'ORGANIZATION' && context.highestScope !== 'PLATFORM') {
      throw new AppError('Insufficient scope to view tasks', 403);
    }

    return await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTask(context: ServiceContext, taskId: string, data: any) {
    const existingTask = await prisma.task.findUnique({ 
      where: { id: taskId },
      include: { project: true }
    });

    if (!existingTask || existingTask.tenantId !== context.tenantId) {
      throw new AppError('Task not found', 404);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      },
      include: {
        assignee: true,
        project: true
      }
    });

    // If assignee changed to a new person, send email
    if (data.assigneeId && data.assigneeId !== existingTask.assigneeId) {
      const assignee = await prisma.employee.findUnique({
        where: { id: data.assigneeId },
        select: { email: true, firstName: true, lastName: true }
      });

      if (assignee && assignee.email) {
        const subject = `New Task Assigned: ${updatedTask.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h3>You've been assigned a new task!</h3>
            <p>Hi ${assignee.firstName} ${assignee.lastName},</p>
            <p>You have been assigned to the following task in project <strong>${existingTask.project?.name}</strong>:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">${updatedTask.title}</h4>
              <p><strong>Priority:</strong> ${updatedTask.priority}</p>
              <p><strong>Status:</strong> ${updatedTask.status}</p>
              ${updatedTask.dueDate ? `<p><strong>Due Date:</strong> ${new Date(updatedTask.dueDate).toLocaleDateString()}</p>` : ''}
            </div>
            <p>Please log in to the PeopleFlow portal to view task details and update your progress.</p>
          </div>
        `;
        try {
          await emailService.sendEmail(assignee.email, subject, html);
        } catch (err) {
          console.error('Failed to send task assignment email to', assignee.email, err);
        }
      }
    }

    return updatedTask;
  }

  async updateTaskStatus(context: ServiceContext, taskId: string, status: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.tenantId !== context.tenantId) {
      throw new AppError('Task not found', 404);
    }

    // TODO: Add complex transition logic (e.g., BACKLOG -> IN_PROGRESS only)

    return await prisma.task.update({
      where: { id: taskId },
      data: { status }
    });
  }

  async addComment(context: ServiceContext, taskId: string, content: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.tenantId !== context.tenantId) {
      throw new AppError('Task not found', 404);
    }

    return await prisma.taskComment.create({
      data: {
        tenantId: context.tenantId,
        taskId: taskId,
        authorId: context.employeeId!,
        content: content
      }
    });
  }
}
