import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';

export class TimesheetService extends BaseService {
  
  async submitTimesheet(context: ServiceContext, data: any) {
    // Basic logic for submitting a timesheet from time entries
    const employeeId = context.employeeId;
    if (!employeeId) throw new AppError('Employee ID required in context', 400);

    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    
    // Validate period dates...
    
    // Create Timesheet
    const timesheet = await prisma.timesheet.create({
      data: {
        tenantId: context.tenantId,
        employeeId: employeeId,
        periodStart,
        periodEnd,
        totalHours: data.totalHours || 0,
        status: 'SUBMITTED'
      }
    });

    // Optionally update associated TimeEntries to point to this timesheet
    if (data.timeEntryIds && Array.isArray(data.timeEntryIds)) {
      await prisma.timeEntry.updateMany({
        where: { id: { in: data.timeEntryIds }, employeeId: employeeId },
        data: { timesheetId: timesheet.id, status: 'SUBMITTED' }
      });
    }

    return timesheet;
  }

  async getTimesheets(context: ServiceContext) {
    const whereClause: any = {
      tenantId: context.tenantId
    };

    if (context.highestScope === 'SELF') {
      whereClause.employeeId = context.employeeId;
    } else if (context.highestScope === 'TEAM') {
      // Find timesheets of direct reports
      whereClause.employee = { reportingTo: context.employeeId };
    }

    return await prisma.timesheet.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: { periodStart: 'desc' }
    });
  }

  async approveTimesheet(context: ServiceContext, timesheetId: string) {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: { employee: true }
    });

    if (!timesheet || timesheet.tenantId !== context.tenantId) {
      throw new AppError('Timesheet not found', 404);
    }

    // Manager approval check
    if (context.highestScope === 'TEAM') {
      if (timesheet.employee.reportingTo !== context.employeeId) {
         throw new AppError('Unauthorized to approve this timesheet', 403);
      }
    }

    if (timesheet.employeeId === context.employeeId) {
      throw new AppError('Employee cannot approve own timesheet', 400);
    }

    return await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: 'MANAGER_APPROVED' }
    });
  }

  async logTime(context: ServiceContext, data: any) {
    return await prisma.timeEntry.create({
      data: {
        tenantId: context.tenantId,
        employeeId: context.employeeId!,
        projectId: data.projectId,
        taskId: data.taskId,
        date: new Date(data.date),
        hours: data.hours,
        description: data.description,
        status: 'DRAFT'
      }
    });
  }
}
