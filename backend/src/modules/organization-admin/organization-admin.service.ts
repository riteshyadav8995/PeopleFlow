import { prisma } from '../../core/base/base.model';
import { cacheService } from '../../core/cache/cache.service';

export class OrganizationAdminService {
  async getDashboardStats(tenantId: string) {
    const cacheKey = `org:stats:${tenantId}`;
    const cachedStats = await cacheService.get(cacheKey);
    
    if (cachedStats) {
      console.log(`[Cache Hit] org:stats:${tenantId}`);
      return JSON.parse(cachedStats);
    }
    
    console.log(`[Cache Miss] org:stats:${tenantId}`);

    const totalStaff = await prisma.employee.count({ where: { tenantId } });
    const activeEmployees = await prisma.employee.count({ where: { tenantId, status: 'active' } });
    const openJobs = await prisma.jobOpening.count({ where: { tenantId, status: 'open' } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presentToday = await prisma.attendanceRecord.count({
      where: {
        tenantId,
        date: { gte: today },
        status: 'present'
      }
    });

    const onLeave = await prisma.leaveRequest.count({
      where: {
        tenantId,
        status: 'approved',
        startDate: { lte: today },
        endDate: { gte: today }
      }
    });

    const pendingLeaves = await prisma.leaveRequest.count({ where: { tenantId, status: 'pending' } });
    const pendingExpenses = await prisma.reimbursementClaim.count({ where: { tenantId, status: 'pending' } });
    const pendingTimesheets = await prisma.timesheet.count({ where: { tenantId, status: 'submitted' } });
    const pendingApprovals = pendingLeaves + pendingExpenses + pendingTimesheets;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const onboarding = await prisma.employee.count({
      where: {
        tenantId,
        joinDate: { gte: thirtyDaysAgo }
      }
    });

    const activeProjects = await prisma.project.count({ where: { tenantId, status: 'active' } });
    const overdueTasks = await prisma.task.count({
      where: {
        tenantId,
        status: { not: 'completed' },
        dueDate: { lt: today }
      }
    });

    const pipelineData = await prisma.application.groupBy({
      by: ['stage'],
      where: { tenantId },
      _count: { stage: true }
    });

    const recruitmentPipeline = {
      applied: pipelineData.find(p => p.stage === 'APPLIED')?._count.stage || 0,
      screening: pipelineData.find(p => p.stage === 'SCREENING')?._count.stage || 0,
      interview: pipelineData.find(p => p.stage === 'INTERVIEW')?._count.stage || 0,
      offer: pipelineData.find(p => p.stage === 'OFFER')?._count.stage || 0,
    };

    const stats = {
      totalStaff,
      activeEmployees,
      openJobs,
      presentToday,
      onLeave,
      pendingApprovals,
      onboarding,
      activeProjects,
      overdueTasks,
      recruitmentPipeline
    };

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, JSON.stringify(stats), 300);

    return stats;
  }

  async getPendingApprovals(tenantId: string) {
    const leaves = await prisma.leaveRequest.findMany({
      where: { tenantId, status: 'pending' },
      include: { employee: { select: { firstName: true, lastName: true } }, leaveType: { select: { name: true } } },
      take: 3
    });

    const expenses = await prisma.reimbursementClaim.findMany({
      where: { tenantId, status: 'pending' },
      include: { employee: { select: { firstName: true, lastName: true } } },
      take: 3
    });

    const approvals = [
      ...leaves.map(l => ({
        id: `leave-${l.id}`,
        type: 'Leave Request',
        requester: `${l.employee.firstName} ${l.employee.lastName}`,
        details: l.leaveType.name,
        status: 'pending'
      })),
      ...expenses.map(e => ({
        id: `expense-${e.id}`,
        type: 'Expense Claim',
        requester: `${e.employee.firstName} ${e.employee.lastName}`,
        details: `$${e.amount} - ${e.category}`,
        status: 'pending'
      }))
    ];

    return approvals.slice(0, 3);
  }

  async getRecentActivity(tenantId: string) {
    return [];
  }
}
