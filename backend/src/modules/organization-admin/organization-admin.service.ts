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

    const trendDays = 7;
    const trendStartDate = new Date(today);
    trendStartDate.setDate(trendStartDate.getDate() - (trendDays - 1));

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        date: { gte: trendStartDate }
      },
      select: { date: true, status: true }
    });

    const leaveRecords = await prisma.leaveRequest.findMany({
      where: {
        tenantId,
        status: 'approved',
        startDate: { lte: today },
        endDate: { gte: trendStartDate }
      },
      select: { startDate: true, endDate: true }
    });

    const attendanceTrend = [];
    for (let i = 0; i < trendDays; i++) {
      const targetDate = new Date(trendStartDate);
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoDate = targetDate.toISOString().split('T')[0];
      
      const presentCount = attendanceRecords.filter(r => {
        const d = new Date(r.date);
        return d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth() && r.status === 'present';
      }).length;

      const onLeaveCount = leaveRecords.filter(r => {
        const start = new Date(r.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(r.endDate);
        end.setHours(23, 59, 59, 999);
        const target = targetDate.getTime();
        return target >= start.getTime() && target <= end.getTime();
      }).length;

      attendanceTrend.push({
        date: dateStr,
        fullDate: isoDate,
        present: presentCount,
        onLeave: onLeaveCount,
        totalStaff: activeEmployees
      });
    }

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
      recruitmentPipeline,
      attendanceTrend
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
