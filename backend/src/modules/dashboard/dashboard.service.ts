import { prisma } from '../../core/base/base.model';
import { cacheService } from '../../core/cache/cache.service';

export class DashboardService {
  async getEmployeeDashboard(tenantId: string, organizationId: string, employeeId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      notifications,
      holidays,
      announcements,
      documents,
      meetings,
      pendingTasks,
      activeProjects,
      attendanceToday
    ] = await Promise.all([
      prisma.notification.findMany({
        where: { tenantId, organizationId, userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.holiday.findMany({
        where: { tenantId, organizationId, date: { gte: today } },
        orderBy: { date: 'asc' },
        take: 3
      }),
      prisma.announcement.findMany({
        where: { 
          tenantId, 
          organizationId, 
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: today } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.document.findMany({
        where: { tenantId, organizationId, employeeId },
        orderBy: { uploadDate: 'desc' },
        take: 4
      }),
      prisma.meeting.findMany({
        where: { 
          tenantId, 
          organizationId, 
          startTime: { gte: today }, // meetings from today onwards
          OR: [
            { organizerId: employeeId },
            { attendees: { string_contains: employeeId } } // Simple check if employeeId is in JSON
          ]
        },
        orderBy: { startTime: 'asc' },
        take: 5
      }),
      prisma.task.count({
        where: { tenantId, organizationId, assigneeId: employeeId, status: { not: 'COMPLETED' } }
      }),
      prisma.project.count({
        where: { tenantId, organizationId, members: { some: { employeeId } }, status: 'ACTIVE' }
      }),
      prisma.attendanceRecord.findFirst({
        where: { 
          tenantId, 
          organizationId, 
          employeeId, 
          date: { gte: startOfDay, lte: endOfDay } 
        }
      })
    ]);

    const dashboardData = {
      notifications,
      holidays,
      announcements,
      documents,
      meetings,
      stats: {
        pendingTasks,
        activeProjects
      },
      attendanceToday
    };

    return dashboardData;
  }

  async markNotificationRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
  }

  async getCalendarEvents(tenantId: string, organizationId: string, employeeId: string, startDate: Date, endDate: Date) {
    const [holidays, meetings, tasks] = await Promise.all([
      prisma.holiday.findMany({
        where: { tenantId, organizationId, date: { gte: startDate, lte: endDate } }
      }),
      prisma.meeting.findMany({
        where: { 
          tenantId, 
          organizationId, 
          startTime: { gte: startDate, lte: endDate },
          OR: [
            { organizerId: employeeId },
            { attendees: { string_contains: employeeId } }
          ]
        }
      }),
      prisma.task.findMany({
        where: { 
          tenantId, 
          organizationId, 
          assigneeId: employeeId,
          dueDate: { gte: startDate, lte: endDate }
        }
      })
    ]);

    return { holidays, meetings, tasks };
  }

  async getManagerProductivity(tenantId: string, organizationId: string, managerEmployeeId: string) {
    // 1. Get all employees reporting to this manager
    const directReports = await prisma.employee.findMany({
      where: {
        tenantId,
        organizationId,
        reportingTo: managerEmployeeId,
        status: 'active'
      },
      select: { id: true }
    });

    const employeeIds = directReports.map(emp => emp.id);

    if (employeeIds.length === 0) {
      return {
        goalsCompleted: 0,
        taskCompletionRate: 0,
        avgVelocity: 0,
        velocityTrend: [0, 0, 0, 0, 0, 0]
      };
    }

    // 2. Fetch Goals
    const [completedGoals, totalTasks, completedTasks] = await Promise.all([
      prisma.goal.count({
        where: {
          tenantId,
          organizationId,
          employeeId: { in: employeeIds },
          status: 'COMPLETED'
        }
      }),
      prisma.task.count({
        where: {
          tenantId,
          organizationId,
          assigneeId: { in: employeeIds }
        }
      }),
      prisma.task.findMany({
        where: {
          tenantId,
          organizationId,
          assigneeId: { in: employeeIds },
          status: 'DONE'
        },
        select: {
          estimatedHours: true,
          updatedAt: true
        }
      })
    ]);

    // Task Completion Rate
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // 3. Avg. Velocity and Velocity Trend
    const now = new Date();
    // 6 weeks ago
    const sixWeeksAgo = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);
    
    let totalVelocityLast30Days = 0;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Initialize trend array for 6 weeks [Week 1, Week 2, ..., Week 6]
    // Week 6 is the most recent week
    const velocityTrend = [0, 0, 0, 0, 0, 0];

    completedTasks.forEach(task => {
      const pts = task.estimatedHours ? Number(task.estimatedHours) : 0;
      
      // Add to last 30 days velocity
      if (task.updatedAt >= thirtyDaysAgo) {
        totalVelocityLast30Days += pts;
      }

      // Add to weekly buckets
      if (task.updatedAt >= sixWeeksAgo) {
        const diffTime = Math.abs(now.getTime() - task.updatedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weekIndex = 5 - Math.floor(diffDays / 7); // 5 is the most recent week index in the array of size 6
        
        if (weekIndex >= 0 && weekIndex <= 5) {
          velocityTrend[weekIndex] += pts;
        }
      }
    });

    return {
      goalsCompleted: completedGoals,
      taskCompletionRate,
      avgVelocity: totalVelocityLast30Days,
      velocityTrend
    };
  }
}

export const dashboardService = new DashboardService();
