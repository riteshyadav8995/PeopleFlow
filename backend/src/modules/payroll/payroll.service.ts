import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { CreateSalaryStructureInput, GeneratePayrollInput } from './payroll.types';
import { prisma } from '../../core/base/base.model';

export class PayrollService extends BaseService {
  async upsertSalaryStructure(context: ServiceContext, data: CreateSalaryStructureInput) {
    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to manage salary structures', 403);
    }
    const tenantId = this.getTenantId(context);

    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return prisma.salaryStructure.upsert({
      where: { employeeId: data.employeeId },
      update: {
        baseSalary: data.baseSalary,
        allowances: data.allowances as any,
        deductions: data.deductions as any,
        effectiveDate: new Date(data.effectiveDate)
      },
      create: {
        tenantId,
        organizationId: employee.organizationId,
        employeeId: data.employeeId,
        baseSalary: data.baseSalary,
        allowances: data.allowances as any,
        deductions: data.deductions as any,
        effectiveDate: new Date(data.effectiveDate)
      }
    });
  }

  async getSalaryStructure(context: ServiceContext, employeeId: string) {
    return prisma.salaryStructure.findUnique({
      where: { employeeId }
    });
  }

  // Maker-Checker: 1. Generate Draft
  async generatePayrollRun(context: ServiceContext, data: { organizationId: string, month: number, year: number, groupId?: string, periodId?: string }) {
    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to generate payroll run', 403);
    }

    const tenantId = this.getTenantId(context);
    const periodIdStr = data.periodId || `${data.year}-${data.month}`;
    const groupIdStr = data.groupId || 'default';

    // Ensure PayrollGroup exists
    let group = await prisma.payrollGroup.findUnique({ where: { id: groupIdStr } });
    if (!group) {
      group = await prisma.payrollGroup.create({
        data: {
          id: groupIdStr,
          tenantId,
          organizationId: data.organizationId,
          name: 'Default Group',
          payFrequency: 'MONTHLY'
        }
      });
    }

    // Ensure PayrollPeriod exists
    let period = await prisma.payrollPeriod.findUnique({ where: { id: periodIdStr } });
    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          id: periodIdStr,
          tenantId,
          organizationId: data.organizationId,
          name: `${data.month}/${data.year}`,
          startDate: new Date(data.year, data.month - 1, 1),
          endDate: new Date(data.year, data.month, 0),
          status: 'OPEN',
          groupId: group.id
        }
      });
    }

    // Create the Payroll Run
    const run = await prisma.payrollRun.create({
      data: {
        tenantId,
        organizationId: data.organizationId,
        groupId: group.id,
        periodId: period.id,
        status: 'DRAFT',
        processedBy: context.employeeId
      }
    });

    // We fetch all employees for this org, then calculate their payslips
    const structures = await prisma.salaryStructure.findMany({
      where: { tenantId, organizationId: data.organizationId }
    });

    const startDate = new Date(data.year, data.month - 1, 1);
    const endDate = new Date(data.year, data.month, 0);
    const totalDaysInMonth = endDate.getDate();

    for (const structure of structures) {
      // 1. Get attendance/unpaid leaves
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          employeeId: structure.employeeId,
          date: { gte: startDate, lte: endDate }
        }
      });
      
      let absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
      let halfDays = attendanceRecords.filter(r => r.status === 'half_day').length;
      let unpaidAbsences = absentDays + (halfDays * 0.5);

      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: structure.employeeId,
          status: 'approved',
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        },
        include: { leaveType: true }
      });

      let unpaidLeaveDays = 0;
      for (const leave of approvedLeaves) {
        const lStart = leave.startDate < startDate ? startDate : leave.startDate;
        const lEnd = leave.endDate > endDate ? endDate : leave.endDate;
        const diffTime = Math.abs(lEnd.getTime() - lStart.getTime());
        const overlapDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        let actualDays = (leave.startDate >= startDate && leave.endDate <= endDate) ? leave.totalDays : overlapDays;

        if (!leave.leaveType.isPaid) {
          unpaidLeaveDays += actualDays;
        }
      }

      const totalUnpaidDays = unpaidAbsences + unpaidLeaveDays;
      const payableDays = Math.max(0, totalDaysInMonth - totalUnpaidDays);
      const prorationFactor = payableDays / totalDaysInMonth;

      // 2. Compute Allowances and Deductions
      const allowances = (structure.allowances as any[]) || [];
      const deductions = (structure.deductions as any[]) || [];

      // Pro-rate basic salary and allowances
      const proRatedBasic = structure.baseSalary * prorationFactor;
      const proRatedAllowances = allowances.map(a => ({ ...a, amount: a.amount * prorationFactor }));
      const totalAllowances = proRatedAllowances.reduce((sum, item) => sum + item.amount, 0);
      
      const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
      const netPay = proRatedBasic + totalAllowances - totalDeductions;

      // Exception Check
      if (netPay < 0) {
        await prisma.payrollException.create({
          data: {
            tenantId,
            runId: run.id,
            employeeId: structure.employeeId,
            severity: 'CRITICAL',
            message: `Negative net pay computed: ${netPay}`
          }
        });
      }

      await prisma.payslip.create({
        data: {
          tenantId,
          organizationId: data.organizationId,
          employeeId: structure.employeeId,
          month: data.month,
          year: data.year,
          baseSalary: proRatedBasic,
          totalAllowances,
          totalDeductions,
          netPay,
          breakdown: { 
            baseSalary: structure.baseSalary, 
            proRatedBasic, 
            allowances: proRatedAllowances, 
            deductions,
            attendance: { totalDaysInMonth, payableDays, unpaidAbsences, unpaidLeaveDays }
          } as any,
          status: 'draft'
        }
      });
    }

    // Move to CALCULATED
    return prisma.payrollRun.update({
      where: { id: run.id },
      data: { status: 'CALCULATED' },
      include: { exceptions: true }
    });
  }

  // Maker-Checker: 2. Approve Run
  async approvePayrollRun(context: ServiceContext, runId: string) {
    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to approve payroll', 403);
    }

    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: { exceptions: true }
    });

    if (!run) throw new AppError('Run not found', 404);
    if (run.status !== 'CALCULATED') throw new AppError('Run must be CALCULATED', 400);

    const unresolvedExceptions = run.exceptions.filter(e => !e.isResolved && e.severity === 'CRITICAL');
    if (unresolvedExceptions.length > 0) {
      throw new AppError('Cannot approve run with unresolved critical exceptions', 400);
    }

    return prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: 'APPROVED',
        approvedBy: context.employeeId
      }
    });
  }

  // Maker-Checker: 3. Lock & Publish Run
  async publishPayrollRun(context: ServiceContext, runId: string) {
    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to publish payroll', 403);
    }

    const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
    if (!run || run.status !== 'APPROVED') {
      throw new AppError('Run must be APPROVED before publishing', 400);
    }

    // Publish payslips
    await prisma.payslip.updateMany({
      where: { tenantId: context.tenantId, organizationId: run.organizationId, status: 'draft' }, 
      data: { status: 'processed' }
    });

    const updatedRun = await prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'LOCKED' }
    });

    // Send emails
    const { sendPayslipNotification } = await import('../../shared/utils/mailer.js');
    const payslips = await prisma.payslip.findMany({
      where: { tenantId: context.tenantId, organizationId: run.organizationId, status: 'processed' },
      include: { 
        employee: { include: { user: true } }
      }
    });
    
    const org = await prisma.organization.findUnique({ where: { id: run.organizationId } });
    const orgName = org?.name || 'Your Company';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for (const payslip of payslips) {
      if (payslip.employee?.user?.email) {
        const monthName = monthNames[payslip.month - 1] || payslip.month.toString();
        sendPayslipNotification(
          payslip.employee.user.email,
          payslip.employee.firstName,
          monthName,
          payslip.year.toString(),
          orgName,
          payslip.netPay
        ).catch((e: any) => console.error('Failed to send payslip email', e));
      }
    }

    return updatedRun;
  }

  async getPayslips(context: ServiceContext, organizationId: string, month?: number, year?: number, managerId?: string, employeeId?: string) {
    const tenantId = this.getTenantId(context);
    let where: any = { tenantId, organizationId };
    
    if (employeeId) {
      where.employeeId = employeeId;
    } else if (managerId) {
      where.employee = { reportingTo: managerId };
    } else if (context.highestScope === 'SELF' && context.employeeId) {
      where.employeeId = context.employeeId;
    } else if (context.highestScope === 'TEAM' && context.employeeId) {
      where.employeeId = context.employeeId; // Default to self if no specific query is provided
    }

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    return prisma.payslip.findMany({
      where,
      include: {
        employee: { 
          select: { 
            firstName: true, 
            lastName: true, 
            employeeCode: true,
            designation: { select: { title: true } },
            department: { select: { name: true } }
          } 
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
  }

  // Auto Generate for All Organizations
  async autoGeneratePayroll(month: number, year: number) {
    const orgs = await prisma.organization.findMany({
      where: { status: 'active' }
    });

    for (const org of orgs) {
      try {
        console.log(`Starting auto-payroll for Org: ${org.id}`);
        // Create a mock context for the system run
        const context: ServiceContext = {
          tenantId: org.tenantId,
          userId: 'system',
          highestScope: 'ORGANIZATION',
          employeeId: 'system',
          roles: [],
          permissions: [],
          requestId: 'system-job'
        };

        const runData = {
          organizationId: org.id,
          month,
          year,
          groupId: 'system-group',
          periodId: 'system-period'
        };

        // 1. Generate
        const runResult = await this.generatePayrollRun(context, runData);
        
        // 2. Approve
        await this.approvePayrollRun(context, runResult.id);

        // 3. Publish & Email
        await this.publishPayrollRun(context, runResult.id);
        
        console.log(`Successfully completed auto-payroll for Org: ${org.id}`);
      } catch (err: any) {
        console.error(`Failed to auto-generate payroll for Org: ${org.id}`, err.message);
      }
    }
  }
}
