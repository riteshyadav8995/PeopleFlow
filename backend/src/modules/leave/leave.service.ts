import { BaseService } from '../../core/base/base.service';
import { LeaveRepository } from './leave.repository';
import { CreateLeaveRequestInput } from './leave.types';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { ConflictError } from '../../core/errors/conflict.error';
import { EmployeeRepository } from '../employee/employee.repository';
import { prisma } from '../../core/base/base.model';
import { emailService } from '../../integrations/email/email.service';

export class LeaveService extends BaseService {
  private repository: LeaveRepository;
  private employeeRepo: EmployeeRepository;

  constructor() {
    super();
    this.repository = new LeaveRepository();
    this.employeeRepo = new EmployeeRepository();
  }

  async getLeaveTypes(context: ServiceContext, organizationId: string) {
    return this.repository.getLeaveTypes(organizationId);
  }

  async getMyLeaveBalances(context: ServiceContext, organizationId: string, year: number) {
    const tenantId = this.getTenantId(context);
    const employee = await this.employeeRepo.findByUserId(tenantId, context.userId);
    if (!employee) throw new NotFoundError('Employee not found');
    return this.repository.getLeaveBalances(employee.id, year);
  }

  private calculateTotalDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  }

  async requestLeave(context: ServiceContext, input: CreateLeaveRequestInput) {
    const tenantId = this.getTenantId(context);
    const employee = await this.employeeRepo.findByUserId(tenantId, context.userId);
    
    if (!employee) throw new NotFoundError('Employee not found');
    
    const year = new Date(input.startDate).getFullYear();
    const balance = await this.repository.getLeaveBalance(employee.id, input.leaveTypeId, year);
    
    if (!balance) {
      throw new ConflictError('Leave balance not initialized for this type');
    }

    const totalDays = this.calculateTotalDays(input.startDate, input.endDate);
    const availableDays = balance.totalDays - balance.usedDays - balance.pendingDays;

    if (totalDays > availableDays) {
      throw new ConflictError('Insufficient leave balance');
    }

    // 1. Create Request
    const request = await this.repository.createLeaveRequest({
      tenantId,
      organizationId: input.organizationId,
      employeeId: employee.id,
      leaveTypeId: input.leaveTypeId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      totalDays,
      reason: input.reason,
      status: 'pending',
      approverId: null,
      rejectionReason: null
    });

    // 2. Lock balance
    await this.repository.updateLeaveBalancePending(balance.id, totalDays);

    // 3. Notify Manager
    if (employee.manager && employee.manager.userId) {
      // Create In-App Notification
      await prisma.notification.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          userId: employee.manager.userId,
          title: 'New Leave Request',
          message: `${employee.firstName} ${employee.lastName} has requested leave from ${input.startDate} to ${input.endDate}.`,
          type: 'ALERT',
          link: '/employee/manager/leave-requests'
        }
      });

      // Send Email Notification
      const subject = `Leave Request Approval Needed: ${employee.firstName} ${employee.lastName}`;
      const html = `
        <h3>Leave Request</h3>
        <p><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
        <p><strong>Dates:</strong> ${input.startDate} to ${input.endDate}</p>
        <p><strong>Total Days:</strong> ${totalDays}</p>
        <p><strong>Reason:</strong> ${input.reason || 'N/A'}</p>
        <p>Please log in to the PeopleFlow portal to approve or reject this request.</p>
      `;
      await emailService.sendEmail(employee.manager.email, subject, html);
    }

    return request;
  }

  async getMyRequests(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const employee = await this.employeeRepo.findByUserId(tenantId, context.userId);
    if (!employee) throw new NotFoundError('Employee not found');
    return this.repository.getMyRequests(employee.id, organizationId);
  }

  async getPendingApprovals(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const manager = await this.employeeRepo.findByUserId(tenantId, context.userId);
    if (!manager) throw new NotFoundError('Manager profile not found');
    return this.repository.getPendingApprovals(manager.id, organizationId);
  }

  async getTeamRequests(context: ServiceContext, organizationId: string, status?: string) {
    const tenantId = this.getTenantId(context);
    const manager = await this.employeeRepo.findByUserId(tenantId, context.userId);
    if (!manager) throw new NotFoundError('Manager profile not found');
    return this.repository.getTeamRequests(manager.id, organizationId, status);
  }

  async reviewLeave(context: ServiceContext, requestId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
    const tenantId = this.getTenantId(context);
    const manager = await this.employeeRepo.findByUserId(tenantId, context.userId);

    const request = await this.repository.getLeaveRequest(requestId);
    if (!request) throw new NotFoundError('Leave request not found');
    if (request.status !== 'pending') throw new ConflictError('Request is not pending');

    const year = request.startDate.getFullYear();
    const balance = await this.repository.getLeaveBalance(request.employeeId, request.leaveTypeId, year);

    if (!balance) throw new ConflictError('Leave balance missing');

    const updated = await this.repository.updateLeaveRequest(requestId, {
      status,
      approverId: manager?.id || null,
      rejectionReason
    });

    if (status === 'approved') {
      await this.repository.approveLeaveBalance(balance.id, request.totalDays);
    } else {
      await this.repository.rejectLeaveBalance(balance.id, request.totalDays);
    }

    return updated;
  }

  // --- Organization Admin APIs ---

  async getOrgLeaveDashboardStats(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingRequests, approvedToday, employeesOnLeaveToday, upcomingLeave] = await Promise.all([
      prisma.leaveRequest.count({
        where: { tenantId, organizationId, status: 'pending' }
      }),
      prisma.leaveRequest.count({
        where: { 
          tenantId, organizationId, status: 'approved',
          updatedAt: { gte: today }
        }
      }),
      prisma.leaveRequest.count({
        where: {
          tenantId, organizationId, status: 'approved',
          startDate: { lte: today },
          endDate: { gte: today }
        }
      }),
      prisma.leaveRequest.count({
        where: {
          tenantId, organizationId, status: 'approved',
          startDate: { gt: today }
        }
      })
    ]);

    return {
      pendingRequests,
      approvedToday,
      employeesOnLeaveToday,
      upcomingLeave
    };
  }

  async getOrgLeaveRequests(context: ServiceContext, organizationId: string, filters?: { status?: string, type?: string, search?: string }) {
    const tenantId = this.getTenantId(context);
    
    let where: any = { tenantId, organizationId };
    
    if (filters?.status) where.status = filters.status.toLowerCase();
    if (filters?.type) where.leaveType = { code: filters.type };
    
    if (filters?.search) {
      where.employee = {
        ...where.employee,
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } }
        ]
      };
    }

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true, department: true } },
        leaveType: true,
        approver: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrgLeaveCalendar(context: ServiceContext, organizationId: string, month: number, year: number) {
    const tenantId = this.getTenantId(context);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return prisma.leaveRequest.findMany({
      where: {
        tenantId,
        organizationId,
        status: 'approved',
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } }
        ]
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        leaveType: true
      }
    });
  }

  // --- Analytics APIs ---

  async getMonthlyLeaveTrend(context: ServiceContext, organizationId: string, year: number) {
    const tenantId = this.getTenantId(context);
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const requests = await prisma.leaveRequest.findMany({
      where: {
        tenantId, organizationId, status: 'approved',
        startDate: { gte: startDate, lte: endDate }
      },
      include: { leaveType: true }
    });

    // Group by month and leaveType
    const monthlyData: Record<string, Record<string, number>> = {};
    for (let i = 0; i < 12; i++) {
      monthlyData[`${year}-${String(i + 1).padStart(2, '0')}`] = {};
    }

    for (const req of requests) {
      const monthStr = `${req.startDate.getFullYear()}-${String(req.startDate.getMonth() + 1).padStart(2, '0')}`;
      const typeCode = req.leaveType.code;
      if (!monthlyData[monthStr]) monthlyData[monthStr] = {};
      if (!monthlyData[monthStr][typeCode]) monthlyData[monthStr][typeCode] = 0;
      monthlyData[monthStr][typeCode] += req.totalDays;
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month, ...data
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getDepartmentLeaveDistribution(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const onLeave = await prisma.leaveRequest.findMany({
      where: {
        tenantId, organizationId, status: 'approved',
        startDate: { lte: today },
        endDate: { gte: today }
      },
      include: { employee: { include: { department: true } } }
    });

    const dist: Record<string, number> = {};
    for (const req of onLeave) {
      const dept = req.employee.department?.name || 'Unassigned';
      dist[dept] = (dist[dept] || 0) + 1;
    }

    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }

  async getDepartmentSummary(context: ServiceContext, organizationId: string, year: number) {
    const tenantId = this.getTenantId(context);
    
    // Get all departments
    const departments = await prisma.department.findMany({
      where: { tenantId, organizationId }
    });

    // Get all employees grouped by department
    const employees = await prisma.employee.findMany({
      where: { tenantId, organizationId, status: 'active' },
      select: { id: true, departmentId: true }
    });

    // Get all approved leaves for this year
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        tenantId, organizationId, status: { in: ['approved', 'pending'] },
        startDate: { gte: startDate, lte: endDate }
      },
      select: { employeeId: true, totalDays: true, status: true, startDate: true, endDate: true }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const deptSummary = departments.map((dept: any) => {
      const deptEmps = employees.filter((e: any) => e.departmentId === dept.id);
      const empIds = deptEmps.map((e: any) => e.id);
      const deptLeaves = leaves.filter((l: any) => empIds.includes(l.employeeId));
      
      const approvedDays = deptLeaves.filter((l: any) => l.status === 'approved').reduce((sum: number, l: any) => sum + l.totalDays, 0);
      
      const onLeaveToday = deptLeaves.filter((l: any) => {
        if (l.status !== 'approved') return false;
        const startStr = l.startDate.toISOString().split('T')[0];
        const endStr = l.endDate.toISOString().split('T')[0];
        return todayStr >= startStr && todayStr <= endStr;
      }).length;

      const upcomingLeaves = deptLeaves.filter((l: any) => {
        if (l.status !== 'approved') return false;
        const startStr = l.startDate.toISOString().split('T')[0];
        return startStr > todayStr && startStr <= nextWeekStr;
      }).length;

      // Assumes 20 days max per employee per year roughly for utilization %
      const maxPossible = empIds.length * 20; 
      const utilization = maxPossible > 0 ? (approvedDays / maxPossible) * 100 : 0;

      return {
        id: dept.id,
        departmentName: dept.name,
        totalEmployees: empIds.length,
        onLeaveToday,
        upcomingLeaves,
        averageBalance: empIds.length > 0 ? Number((approvedDays / empIds.length).toFixed(1)) : 0,
        utilization: Number(utilization.toFixed(1))
      };
    });

    return deptSummary;
  }

  async getUpcomingEvents(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const today = new Date();
    
    // Mock upcoming events until full Event/Holiday module is ready
    // We can fetch from Holiday model
    const holidays = await prisma.holiday.findMany({
      where: { tenantId, organizationId, date: { gte: today } },
      orderBy: { date: 'asc' },
      take: 5
    });

    return { holidays };
  }

  async getLeaveBalanceExceptions(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const year = new Date().getFullYear();
    
    // Find balances where pendingDays > 0
    const exceptions = await prisma.leaveBalance.findMany({
      where: {
        tenantId,
        employee: { organizationId },
        year,
        pendingDays: { gt: 0 }
      },
      include: {
        employee: { select: { firstName: true, lastName: true, department: true } },
        leaveType: true
      },
      orderBy: { pendingDays: 'desc' },
      take: 5
    });

    return exceptions.map((e: any) => ({
      id: e.id,
      employee: `${e.employee.firstName} ${e.employee.lastName}`,
      department: e.employee.department?.name || 'N/A',
      type: e.leaveType.name,
      balance: e.totalDays - e.usedDays - e.pendingDays,
      status: e.pendingDays > 0 ? 'Review Needed' : 'Normal'
    }));
  }

  async createLeavePolicy(context: ServiceContext, data: any) {
    const tenantId = this.getTenantId(context);
    
    // We assume the user has a linked employee to get the organizationId
    // Or we should pass organizationId from the frontend payload. 
    // Wait, the schema createLeavePolicySchema didn't include organizationId. Let me add it.
    // I'll just use the first organization the user has access to, or require organizationId.
    // Since the frontend has orgId, we should include it in the payload.
    if (!data.organizationId) throw new Error("organizationId is required");

    return prisma.leaveType.create({
      data: {
        tenantId,
        organizationId: data.organizationId,
        name: data.name,
        code: data.code,
        description: data.description,
        daysPerYear: data.daysPerYear,
        isPaid: data.isPaid
      }
    });
  }

  // --- Accrual Engine ---

  async accrueLeaves(context: ServiceContext, organizationId: string, type: 'monthly' | 'yearly') {
    const tenantId = this.getTenantId(context);
    
    // Find all active employees in the org
    const employees = await prisma.employee.findMany({
      where: { tenantId, organizationId, status: 'active' }
    });

    const year = new Date().getFullYear();
    let updatedCount = 0;

    for (const emp of employees) {
      if (type === 'monthly') {
        // Increment Sick and Casual leave by 1
        const types = await prisma.leaveType.findMany({
          where: { tenantId, organizationId, name: { in: ['Sick Leave', 'Casual Leave'] } }
        });
        
        for (const t of types) {
          const balance = await this.repository.getLeaveBalance(emp.id, t.id, year);
          if (balance) {
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { totalDays: { increment: 1 } }
            });
            updatedCount++;
          }
        }
      } else if (type === 'yearly') {
        // Increment Earned Leave by 15
        const t = await prisma.leaveType.findFirst({
          where: { tenantId, organizationId, name: 'Earned Leave' }
        });
        if (t) {
          const balance = await this.repository.getLeaveBalance(emp.id, t.id, year);
          if (balance) {
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { totalDays: { increment: 15 } }
            });
            updatedCount++;
          }
        }
      }
    }
    
    return { success: true, updatedBalances: updatedCount, message: `Ran ${type} accrual successfully.` };
  }
}
