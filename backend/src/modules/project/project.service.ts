import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { emailService } from '../../integrations/email/email.service';

export class ProjectService extends BaseService {
  
  async createProject(context: ServiceContext, data: any) {
    // Requires project.record.create
    const orgId = data.organizationId || context.organizationId;
    if (!orgId) throw new AppError('organizationId is required', 400);

    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          tenantId: context.tenantId,
          organizationId: orgId,
          name: data.name,
          code: data.code,
          description: data.description,
          clientName: data.clientName,
          type: data.type || 'INTERNAL',
          visibility: data.visibility || 'ORGANIZATION',
          status: 'DRAFT',
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          managerId: data.managerId,
          budget: data.budget
        }
      });

      const memberIds = Array.isArray(data.employeeIds) ? data.employeeIds : [];
      if (data.managerId && !memberIds.includes(data.managerId)) {
        memberIds.push(data.managerId);
      }

      if (memberIds.length > 0) {
        await tx.projectMember.createMany({
          data: memberIds.map((empId: string) => ({
            tenantId: context.tenantId,
            projectId: project.id,
            employeeId: empId,
            role: empId === data.managerId ? 'MANAGER' : 'DEVELOPER',
            allocation: 100
          }))
        });

        // Send Email Notifications
        const employees = await tx.employee.findMany({
          where: { id: { in: memberIds }, tenantId: context.tenantId },
          select: { email: true, firstName: true, lastName: true, id: true }
        });

        for (const emp of employees) {
          if (emp.email) {
            const role = emp.id === data.managerId ? 'Manager' : 'Team Member';
            const subject = `Project Assignment: ${project.name}`;
            const html = `
              <h3>You've been assigned to a project!</h3>
              <p>Hi ${emp.firstName} ${emp.lastName},</p>
              <p>You have been assigned to the project <strong>${project.name}</strong> (${project.code}) with the role of <strong>${role}</strong>.</p>
              <p>Please log in to the PeopleFlow portal to view project details.</p>
            `;
            try {
              await emailService.sendEmail(emp.email, subject, html);
            } catch (err) {
              console.error('Failed to send project assignment email to', emp.email, err);
            }
          }
        }
      }

      return project;
    });
  }

  async getProjects(context: ServiceContext, organizationId?: string) {
    const orgId = organizationId || context.organizationId;
    if (!orgId) throw new AppError('organizationId is required', 400);

    const whereClause: any = {
      tenantId: context.tenantId,
      organizationId: orgId,
    };

    if (['ASSIGNED', 'TEAM', 'SELF'].includes(context.highestScope || '')) {
      whereClause.OR = [
        { managerId: context.employeeId },
        { members: { some: { employeeId: context.employeeId } } }
      ];
      if (context.highestScope === 'TEAM' && context.employeeId) {
        whereClause.OR.push({ manager: { reportingTo: context.employeeId } });
        whereClause.OR.push({ members: { some: { employee: { reportingTo: context.employeeId } } } });
      }
    } else if (context.highestScope !== 'ORGANIZATION' && context.highestScope !== 'PLATFORM') {
      throw new AppError('Insufficient scope to view projects', 403);
    }

    return await prisma.project.findMany({
      where: whereClause,
      include: {
        manager: true,
        _count: {
          select: { tasks: true, members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProjectDetails(context: ServiceContext, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: true,
        members: {
          include: { employee: true }
        },
        milestones: true
      }
    });

    if (!project || project.tenantId !== context.tenantId) {
      throw new AppError('Project not found', 404);
    }

    if (['ASSIGNED', 'TEAM', 'SELF'].includes(context.highestScope || '')) {
      const isManager = project.managerId === context.employeeId;
      const isMember = project.members.some((m: any) => m.employeeId === context.employeeId);
      
      let isTeamProject = false;
      if (context.highestScope === 'TEAM' && context.employeeId) {
        isTeamProject = 
          project.manager?.reportingTo === context.employeeId ||
          project.members.some((m: any) => m.employee?.reportingTo === context.employeeId);
      }

      if (!isManager && !isMember && !isTeamProject) {
        throw new AppError('Unauthorized to view this project', 403);
      }
    } else if (context.highestScope !== 'ORGANIZATION' && context.highestScope !== 'PLATFORM') {
      throw new AppError('Insufficient scope to view project details', 403);
    }

    return project;
  }

  async updateProjectStatus(context: ServiceContext, projectId: string, status: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== context.tenantId) {
      throw new AppError('Project not found', 404);
    }

    // Only allow specific transitions or authorized personnel
    return await prisma.project.update({
      where: { id: projectId },
      data: { status }
    });
  }

  async addProjectMember(context: ServiceContext, projectId: string, data: { employeeId: string, role?: string, allocation?: number }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });
    
    if (!project || project.tenantId !== context.tenantId) {
      throw new AppError('Project not found', 404);
    }

    if (['ASSIGNED', 'TEAM'].includes(context.highestScope || '')) {
      const isManager = project.managerId === context.employeeId;
      if (!isManager) {
        throw new AppError('Unauthorized to add members to this project', 403);
      }
    } else if (context.highestScope !== 'ORGANIZATION' && context.highestScope !== 'PLATFORM') {
      throw new AppError('Insufficient scope to add members', 403);
    }

    // Check if member already exists
    const existing = project.members.find((m: any) => m.employeeId === data.employeeId);
    if (existing) {
      throw new AppError('Employee is already a member of this project', 400);
    }

    const member = await prisma.projectMember.create({
      data: {
        tenantId: context.tenantId,
        projectId: projectId,
        employeeId: data.employeeId,
        role: data.role || 'DEVELOPER',
        allocation: data.allocation || 100
      }
    });

    // Send Email Notification
    const emp = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      select: { email: true, firstName: true, lastName: true }
    });

    if (emp && emp.email) {
      const subject = `Project Assignment: ${project.name}`;
      const html = `
        <h3>You've been assigned to a project!</h3>
        <p>Hi ${emp.firstName} ${emp.lastName},</p>
        <p>You have been assigned to the project <strong>${project.name}</strong> (${project.code}) with the role of <strong>${data.role || 'DEVELOPER'}</strong>.</p>
        <p>Please log in to the PeopleFlow portal to view project details.</p>
      `;
      try {
        await emailService.sendEmail(emp.email, subject, html);
      } catch (err) {
        console.error('Failed to send project assignment email to', emp.email, err);
      }
    }

    return member;
  }
}
