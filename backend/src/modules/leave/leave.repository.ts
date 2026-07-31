import { BaseRepository } from '../../core/base/base.repository';
import { LeaveRequest, LeaveBalance, LeaveType } from '@prisma/client';

export class LeaveRepository extends BaseRepository {
  async getLeaveTypes(organizationId: string): Promise<LeaveType[]> {
    return this.prisma.leaveType.findMany({
      where: { organizationId, isActive: true }
    });
  }

  async getLeaveBalances(employeeId: string, year: number): Promise<LeaveBalance[]> {
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true }
    });
  }

  async getLeaveBalance(employeeId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null> {
    return this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year
        }
      }
    });
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    return this.prisma.leaveRequest.findUnique({ where: { id } });
  }

  async createLeaveRequest(data: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.create({
      data,
      include: { leaveType: true }
    });
  }

  async updateLeaveRequest(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.update({
      where: { id },
      data
    });
  }

  async updateLeaveBalancePending(balanceId: string, days: number): Promise<void> {
    await this.prisma.leaveBalance.update({
      where: { id: balanceId },
      data: {
        pendingDays: { increment: days }
      }
    });
  }

  async approveLeaveBalance(balanceId: string, days: number): Promise<void> {
    await this.prisma.leaveBalance.update({
      where: { id: balanceId },
      data: {
        pendingDays: { decrement: days },
        usedDays: { increment: days }
      }
    });
  }

  async rejectLeaveBalance(balanceId: string, days: number): Promise<void> {
    await this.prisma.leaveBalance.update({
      where: { id: balanceId },
      data: {
        pendingDays: { decrement: days }
      }
    });
  }

  async getMyRequests(employeeId: string, organizationId: string): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId, organizationId },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingApprovals(managerId: string, organizationId: string): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        status: 'pending',
        employee: {
          reportingTo: managerId
        }
      },
      include: { 
        employee: { select: { firstName: true, lastName: true } },
        leaveType: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTeamRequests(managerId: string, organizationId: string, status?: string): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
        employee: {
          reportingTo: managerId
        }
      },
      include: { 
        employee: { select: { firstName: true, lastName: true, designation: { select: { title: true } } } },
        leaveType: true 
      },
      orderBy: { startDate: 'asc' }
    });
  }
}
