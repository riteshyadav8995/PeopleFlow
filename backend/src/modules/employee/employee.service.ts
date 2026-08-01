import { BaseService } from '../../core/base/base.service';
import { EmployeeRepository } from './employee.repository';
import { EmployeeCreateInput, EmployeeUpdateInput, EmployeeResponse } from './employee.types';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { ConflictError } from '../../core/errors/conflict.error';
import { Employee } from '@prisma/client';
import { prisma } from '../../core/base/base.model';
import { passwordUtil } from '../../shared/utils/password.util';
import { tokenUtil } from '../../shared/utils/token.util';
import { emailUtil } from '../../shared/utils/email.util';
import crypto from 'crypto';

export class EmployeeService extends BaseService {
  private repository: EmployeeRepository;

  constructor() {
    super();
    this.repository = new EmployeeRepository();
  }

  private mapToResponse(employee: any): EmployeeResponse {
    const { createdAt, updatedAt, ...rest } = employee;
    return rest;
  }

  async createEmployee(context: ServiceContext, input: EmployeeCreateInput): Promise<EmployeeResponse> {
    const tenantId = this.getTenantId(context);
    
    const existing = await this.repository.findByOrganizationId(tenantId, input.organizationId);
    if (existing.some(e => e.employeeCode === input.employeeCode)) {
      throw new ConflictError('An employee with this code already exists in the organization');
    }
    if (existing.some(e => e.email === input.email)) {
      throw new ConflictError('An employee with this email already exists in the organization');
    }

    const { role, ...employeeData } = input;
    const roleSlug = role ? role.toLowerCase().replace(/ /g, '_') : 'employee';

    // Execute in a transaction to ensure atomic creation of User, Role, and Employee
    const employee = await prisma.$transaction(async (tx) => {
      // 1. Create a random secure password for the user initially
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await passwordUtil.hash(randomPassword);

      // 2. Create the User record
      const user = await tx.user.create({
        data: {
          tenantId,
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
          status: 'pending_verification',
        }
      });

      // 3. Find or Create the specified Role
      let roleRecord = await tx.role.findFirst({
        where: { tenantId, slug: roleSlug }
      });
      if (!roleRecord) {
        roleRecord = await tx.role.create({
          data: {
            tenantId,
            name: role || 'Employee',
            slug: roleSlug,
            description: `${role || 'Employee'} role created automatically`
          }
        });
      }

      // 4. Assign the Role to the User
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
          tenantId
        }
      });

      // 5. Create the Employee profile linked to the user
      const newEmployee = await tx.employee.create({
        data: {
          tenantId,
          userId: user.id,
          ...employeeData
        }
      });

      // 6. Generate Activation Token
      const activationToken = tokenUtil.generateActivationToken(user.id);
      const activationUrl = `${process.env.FRONTEND_URL || 'https://people-flow-rose.vercel.app'}/activate?token=${activationToken}`;

      // 7. Fetch Organization to get org name for the email
      const org = await tx.organization.findUnique({ where: { id: input.organizationId } });

      // 8. Send the invitation email
      await emailUtil.sendActivationEmail(input.email, activationUrl, org?.name || 'Your Organization', role || 'Employee');

      // 9. Create Welcome Notification
      await tx.notification.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          userId: user.id,
          title: 'Welcome to PeopleFlow!',
          message: `Your account has been successfully created for ${org?.name || 'Your Organization'}. Please set up your profile.`,
          type: 'INFO',
          link: '/employee/profile'
        }
      });

      return newEmployee;
    });

    return this.mapToResponse(employee);
  }

  async getEmployee(context: ServiceContext, id: string): Promise<EmployeeResponse> {
    const tenantId = this.getTenantId(context);
    const employee = await this.repository.findById(tenantId, id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    return this.mapToResponse(employee);
  }

  async listEmployees(
    context: ServiceContext,
    pagination: { page: number; limit: number },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    let whereClause: any = { tenantId: context.tenantId };
    
    // Apply Data Scoping
    if (context.highestScope === 'SELF' && context.employeeId) {
      whereClause.id = context.employeeId;
    } else if (context.highestScope === 'TEAM' && context.employeeId) {
      whereClause.OR = [
        { managerId: context.employeeId },
        { id: context.employeeId }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          department: true,
          designation: true,
          manager: {
            select: { firstName: true, lastName: true },
          },
          salaryStructure: true
        },
        orderBy: { joinDate: 'desc' },
      }),
      prisma.employee.count({ where: whereClause }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listEmployeesByOrg(context: ServiceContext, organizationId: string, managerId?: string) {
    const tenantId = this.getTenantId(context);
    const employees = await this.repository.findByOrganizationId(tenantId, organizationId, managerId);
    return employees.map(emp => this.mapToResponse(emp));
  }

  async updateEmployee(context: ServiceContext, id: string, input: EmployeeUpdateInput): Promise<EmployeeResponse> {
    const tenantId = this.getTenantId(context);
    await this.getEmployee(context, id);
    
    const employee = await this.repository.update(tenantId, id, input);
    return this.mapToResponse(employee);
  }

  async deleteEmployee(context: ServiceContext, id: string): Promise<void> {
    const tenantId = this.getTenantId(context);
    await this.getEmployee(context, id);
    await this.repository.delete(tenantId, id);
  }

  async getTeamMetrics(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const managerId = context.highestScope === 'TEAM' ? context.employeeId : undefined;
    
    // Find all team members if manager, else all in org
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        organizationId,
        ...(managerId ? { reportingTo: managerId } : {})
      },
      select: {
        id: true,
        joinDate: true,
        exitDate: true,
        status: true,
        department: { select: { name: true } }
      }
    });

    const totalMembers = employees.filter(e => e.status !== 'terminated' && e.status !== 'resigned').length;
    
    let totalTenureDays = 0;
    const now = new Date();
    employees.forEach(emp => {
      if (emp.joinDate) {
        const end = emp.exitDate || now;
        totalTenureDays += (end.getTime() - new Date(emp.joinDate).getTime()) / (1000 * 3600 * 24);
      }
    });

    const avgTenureYears = totalMembers ? (totalTenureDays / totalMembers / 365).toFixed(1) : 0;

    // Headcount growth (last 12 months)
    const headcountGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      // count active employees at that month
      const count = employees.filter(e => {
        const jd = new Date(e.joinDate);
        const joinBefore = jd.getFullYear() < year || (jd.getFullYear() === year && jd.getMonth() <= month);
        const exitAfter = !e.exitDate || new Date(e.exitDate).getFullYear() > year || (new Date(e.exitDate).getFullYear() === year && new Date(e.exitDate).getMonth() > month);
        return joinBefore && exitAfter;
      }).length;
      headcountGrowth.push(count);
    }

    // Attrition (last 12 months)
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const exitsLastYear = employees.filter(e => e.exitDate && new Date(e.exitDate) > yearAgo).length;
    const startCount = headcountGrowth[0] || 1;
    const attrition = ((exitsLastYear / startCount) * 100).toFixed(1);

    // Composition by Department
    const composition: Record<string, number> = {};
    employees.filter(e => e.status !== 'terminated' && e.status !== 'resigned').forEach(e => {
      const dept = e.department?.name || 'Unassigned';
      composition[dept] = (composition[dept] || 0) + 1;
    });

    return {
      totalMembers,
      avgTenureYears,
      openHeadcounts: 2, // Mocked for now as we don't have job openings tied easily to manager
      attrition,
      headcountGrowth,
      composition: Object.entries(composition).map(([name, count]) => ({ name, count }))
    };
  }
}
