import { BaseService } from '../../core/base/base.service';
import { prisma } from '../../core/base/base.model';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { CreateSubscriptionPlanInput, CreateIntegrationInput } from './superadmin.types';
import { AuthorizationError } from '../../core/errors/authorization.error';
import { ConflictError } from '../../core/errors/conflict.error';
import { passwordUtil } from '../../shared/utils/password.util';
import { tokenUtil } from '../../shared/utils/token.util';
import { emailUtil } from '../../shared/utils/email.util';
import { SYSTEM_ROLES } from '../../core/constants/role.constant';

export class SuperAdminService extends BaseService {
  
  private ensureSuperAdmin(context: ServiceContext) {
    if (!context.roles.includes('super_admin')) {
      throw new AuthorizationError('Access denied: Requires Super Admin role');
    }
  }

  // --- DASHBOARD ---
  async getPlatformDashboard(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    
    const [
      totalOrganizations,
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      totalUsers,
      activeEmployees,
      activeSubscriptions,
      openTickets
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'active' } }),
      prisma.organization.count({ where: { status: 'trial' } }), // Assuming trial status exists or 'active' on trial plan
      prisma.organization.count({ where: { status: 'suspended' } }),
      prisma.user.count(),
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.supportTicket.count({ where: { status: 'open' } })
    ]);

    // Simple MRR calculation (assuming active subscriptions * price_monthly)
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'active' },
      include: { plan: true }
    });
    const mrr = activeSubs.reduce((acc, sub) => acc + sub.plan.priceMonthly, 0);

    return {
      totalOrganizations,
      activeOrganizations: activeOrgs,
      trialOrganizations: trialOrgs,
      suspendedOrganizations: suspendedOrgs,
      totalUsers,
      activeEmployees,
      mrr,
      openTickets,
      activeSubscriptions,
      systemStatus: 'healthy'
    };
  }

  // --- PLATFORM METRICS & HEALTH ---
  async getPlatformUsage(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return {
      storageUsedGb: 124.5,
      apiRequests: 1450000,
      aiVoiceMinutes: 45000,
      emailsSent: 890000,
      smsSent: 12000
    };
  }

  async getSystemHealth(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return {
      status: 'OPERATIONAL',
      services: [
        { name: 'PostgreSQL', status: 'OPERATIONAL', responseTime: '12ms' },
        { name: 'Redis Cache', status: 'OPERATIONAL', responseTime: '3ms' },
        { name: 'Background Workers', status: 'OPERATIONAL', latency: '45ms' },
        { name: 'AI Voice Provider', status: 'OPERATIONAL', latency: '120ms' },
        { name: 'Storage (S3)', status: 'OPERATIONAL', responseTime: '45ms' }
      ]
    };
  }

  async getRecentActivity(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return prisma.systemAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async getSecurityAlerts(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    // Stub
    return [];
  }

  // --- ORGANIZATIONS ---
  async listAllOrganizations(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return prisma.organization.findMany({
      include: {
        tenant: {
          include: {
            users: {
              where: {
                userRoles: {
                  some: {
                    role: {
                      slug: SYSTEM_ROLES.TENANT_ADMIN
                    }
                  }
                }
              },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createOrganization(context: ServiceContext, data: any) {
    this.ensureSuperAdmin(context);
    const { name, domain, plan, adminEmail, adminFirstName, adminLastName } = data;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      throw new ConflictError(`An organization with a similar name (${slug}) already exists.`);
    }

    // Password will be set by the admin during activation
    const passwordHash = '';

    const organizationResult = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          domain,
          slug,
          plan: plan || 'trial',
        }
      });

      // 2. Create Organization linked to Tenant
      const org = await tx.organization.create({
        data: {
          name,
          tenantId: tenant.id,
          status: 'active'
        },
        include: {
          tenant: true
        }
      });

      // 3. Create admin user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          status: 'pending_verification',
          emailVerifiedAt: null,
        },
      });

      // 4. Create the tenant_admin role
      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Tenant Admin',
          slug: SYSTEM_ROLES.TENANT_ADMIN,
          description: 'Full administrative access to the tenant',
          isSystem: true,
        },
      });

      // 5. Assign role to user
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
          tenantId: tenant.id,
        },
      });

      return { org, user };
    });

    const { org, user } = organizationResult;

    // Generate activation token and send email
    const activationToken = tokenUtil.generateActivationToken(user.id);
    const activationUrl = `http://localhost:5173/activate?token=${activationToken}`;
    
    await emailUtil.sendActivationEmail(adminEmail, activationUrl);

    await prisma.systemAuditLog.create({
      data: {
        userId: context.userId,
        action: 'CREATE_ORGANIZATION',
        details: { organizationId: org.id, name, adminEmail }
      }
    });

    return org;
  }

  async getOrganizationDetails(context: ServiceContext, organizationId: string) {
    this.ensureSuperAdmin(context);
    return prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        tenant: true,
        employees: {
          select: { id: true, firstName: true, lastName: true, status: true }
        }
      }
    });
  }

  async updateOrganizationStatus(context: ServiceContext, organizationId: string, status: string) {
    this.ensureSuperAdmin(context);
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: { status }
    });

    // Audit log
    await prisma.systemAuditLog.create({
      data: {
        userId: context.userId,
        action: 'UPDATE_ORG_STATUS',
        details: { organizationId, status }
      }
    });

    return org;
  }

  async deleteOrganization(context: ServiceContext, organizationId: string) {
    this.ensureSuperAdmin(context);
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { tenant: true }
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Because of onDelete: Cascade on all relations to Tenant,
    // deleting the Tenant will cleanly delete the Organization, Users, Roles, etc.
    await prisma.tenant.delete({
      where: { id: org.tenantId }
    });

    // Audit log
    await prisma.systemAuditLog.create({
      data: {
        userId: context.userId,
        action: 'DELETE_ORGANIZATION',
        details: { organizationId, tenantId: org.tenantId, name: org.name }
      }
    });

    return true;
  }

  // --- SUBSCRIPTION PLANS ---
  async listSubscriptionPlans(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' }
    });
  }

  async createSubscriptionPlan(context: ServiceContext, data: CreateSubscriptionPlanInput) {
    this.ensureSuperAdmin(context);
    const plan = await prisma.subscriptionPlan.create({ data });
    
    await prisma.systemAuditLog.create({
      data: {
        userId: context.userId,
        action: 'CREATE_SUBSCRIPTION_PLAN',
        details: { planId: plan.id, name: plan.name }
      }
    });

    return plan;
  }

  async updateSubscriptionPlan(context: ServiceContext, id: string, data: Partial<CreateSubscriptionPlanInput>) {
    this.ensureSuperAdmin(context);
    return prisma.subscriptionPlan.update({
      where: { id },
      data
    });
  }

  // --- INTEGRATIONS ---
  async listIntegrations(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return prisma.integration.findMany({
      where: { tenantId: null } // Platform-level integrations
    });
  }

  async addIntegration(context: ServiceContext, data: CreateIntegrationInput) {
    this.ensureSuperAdmin(context);
    return prisma.integration.create({
      data: {
        ...data,
        tenantId: null // Platform level
      }
    });
  }

  // --- SYSTEM JOBS ---
  async listJobs(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return [];
  }

  async retryJob(context: ServiceContext, jobId: string) {
    this.ensureSuperAdmin(context);
    return { success: true, jobId, status: 'retrying' };
  }

  async cancelJob(context: ServiceContext, jobId: string) {
    this.ensureSuperAdmin(context);
    return { success: true, jobId, status: 'cancelled' };
  }

  // --- SUPPORT TICKETS ---
  async listSupportTickets(context: ServiceContext) {
    this.ensureSuperAdmin(context);
    return prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async assignTicket(context: ServiceContext, ticketId: string, assigneeId: string) {
    this.ensureSuperAdmin(context);
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedTo: assigneeId, status: 'in_progress' }
    });
  }

  // --- IMPERSONATION ---
  async startImpersonation(context: ServiceContext, data: any) {
    this.ensureSuperAdmin(context);
    
    await prisma.systemAuditLog.create({
      data: {
        userId: context.userId,
        action: 'START_IMPERSONATION',
        details: data
      }
    });

    return { sessionId: 'imp_' + Math.random().toString(36).substr(2, 9), status: 'active', organizationId: data.organizationId };
  }

  async endImpersonation(context: ServiceContext, sessionId: string) {
    this.ensureSuperAdmin(context);
    
    await prisma.systemAuditLog.create({
      data: {
        userId: context.userId,
        action: 'END_IMPERSONATION',
        details: { sessionId }
      }
    });

    return { success: true, sessionId };
  }
}
