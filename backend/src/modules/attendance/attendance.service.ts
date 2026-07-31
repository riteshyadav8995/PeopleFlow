import { BaseService } from '../../core/base/base.service';
import { AttendanceRepository } from './attendance.repository';
import { ClockInInput, ClockOutInput, AttendanceResponse } from './attendance.types';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { ConflictError } from '../../core/errors/conflict.error';
import { NotFoundError } from '../../core/errors/not-found.error';
import { AppError } from '../../core/errors/app.error';
import { EmployeeRepository } from '../employee/employee.repository';
import { prisma } from '../../core/base/base.model';

export class AttendanceService extends BaseService {
  private repository: AttendanceRepository;
  private employeeRepo: EmployeeRepository;

  constructor() {
    super();
    this.repository = new AttendanceRepository();
    this.employeeRepo = new EmployeeRepository();
  }

  // Haversine formula to calculate distance between two lat/lng points in meters
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  }

  async clockIn(context: ServiceContext, input: ClockInInput): Promise<AttendanceResponse> {
    const tenantId = this.getTenantId(context);
    const userId = context.userId;

    // Find the employee linked to this user
    const employee = await this.employeeRepo.findByUserId(tenantId, userId);

    if (!employee) {
      throw new NotFoundError('Employee profile not found for this user');
    }

    // Geo-fencing validation
    let isGeoVerified = false;
    if (employee.branch?.latitude && employee.branch?.longitude && input.latitude && input.longitude) {
      const distance = this.getDistance(
        input.latitude, input.longitude,
        employee.branch.latitude, employee.branch.longitude
      );
      if (distance <= 500) {
        isGeoVerified = true;
      } else {
        throw new ConflictError(`You must be within 500 meters of ${employee.branch.name} to clock in. Distance: ${Math.round(distance)}m`);
      }
    }

    const today = new Date();
    const existingRecord = await this.repository.getTodayRecord(employee.id, today);

    if (existingRecord) {
      throw new ConflictError('Already clocked in for today');
    }

    const record = await this.repository.clockIn({
      tenantId,
      organizationId: input.organizationId,
      employeeId: employee.id,
      date: today,
      clockInTime: today,
      clockOutTime: null,
      status: 'present',
      totalHours: null,
      ipAddress: input.ipAddress || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      isGeoVerified
    });

    return record;
  }

  async clockOut(context: ServiceContext, input: ClockOutInput): Promise<AttendanceResponse> {
    const tenantId = this.getTenantId(context);
    const userId = context.userId;

    const employee = await this.employeeRepo.findByUserId(tenantId, userId);

    if (!employee) {
      throw new NotFoundError('Employee profile not found for this user');
    }

    // Geo-fencing validation for clock-out as well
    if (employee.branch?.latitude && employee.branch?.longitude && input.latitude && input.longitude) {
      const distance = this.getDistance(
        input.latitude, input.longitude,
        employee.branch.latitude, employee.branch.longitude
      );
      if (distance > 500) {
        throw new ConflictError(`You must be within 500 meters of ${employee.branch.name} to clock out. Distance: ${Math.round(distance)}m`);
      }
    }

    const today = new Date();
    const existingRecord = await this.repository.getTodayRecord(employee.id, today);

    if (!existingRecord) {
      throw new ConflictError('No clock-in record found for today');
    }

    if (existingRecord.clockOutTime) {
      throw new ConflictError('Already clocked out for today');
    }

    const clockOutTime = new Date();
    const diffMs = clockOutTime.getTime() - existingRecord.clockInTime.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);

    const record = await this.repository.clockOut(existingRecord.id, clockOutTime, totalHours);
    return record;
  }

  async listAttendance(context: ServiceContext, organizationId: string, month: number, year: number, managerId?: string, employeeId?: string) {
    const tenantId = this.getTenantId(context);
    
    // Build date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const whereClause: any = {
      tenantId,
      organizationId,
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    if (employeeId === 'me' || employeeId === context.employeeId) {
      whereClause.employeeId = context.employeeId;
    } else if (employeeId) {
      whereClause.employeeId = employeeId;
    } else if (managerId) {
      whereClause.employee = { reportingTo: managerId };
    } else if (context.highestScope === 'SELF' && context.employeeId) {
      whereClause.employeeId = context.employeeId;
    } else if (context.highestScope === 'TEAM' && context.employeeId) {
      whereClause.employee = { reportingTo: context.employeeId };
    }

    return prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true, department: true } }
      },
      orderBy: { date: 'desc' }
    });
  }

  // --- Organization Admin APIs ---

  async getOrgDashboardStats(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, todayRecords, employeesOnLeave] = await Promise.all([
      prisma.employee.count({ where: { tenantId, status: 'active' } }),
      prisma.attendanceRecord.findMany({
        where: { tenantId, date: { gte: today } }
      }),
      prisma.leaveRequest.count({
        where: { 
          tenantId, status: 'approved',
          startDate: { lte: today },
          endDate: { gte: today }
        }
      })
    ]);

    const present = todayRecords.filter(r => r.status === 'present').length;
    const late = todayRecords.filter(r => r.status === 'late').length;
    const halfDay = todayRecords.filter(r => r.status === 'half_day').length;
    const absent = totalEmployees - (present + late + halfDay) - employeesOnLeave;

    return {
      totalEmployees,
      presentToday: present + late + halfDay,
      absent: Math.max(0, absent),
      onLeave: employeesOnLeave,
      lateArrivals: late,
      missingPunches: todayRecords.filter(r => r.clockInTime && !r.clockOutTime).length
    };
  }

  async getOrgAttendanceTrends(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await prisma.attendanceRecord.findMany({
      where: { tenantId, date: { gte: thirtyDaysAgo } },
      select: { date: true, status: true }
    });

    const trends = records.reduce((acc: any, curr) => {
      const dateStr = curr.date.toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = { present: 0, absent: 0, late: 0, leave: 0 };
      if (curr.status === 'present' || curr.status === 'half_day') acc[dateStr].present++;
      else if (curr.status === 'late') acc[dateStr].late++;
      else if (curr.status === 'absent') acc[dateStr].absent++;
      return acc;
    }, {});

    return Object.keys(trends).sort().map(date => ({
      date,
      ...trends[date]
    }));
  }

  async getOrgExceptions(context: ServiceContext, organizationId: string) {
    const tenantId = this.getTenantId(context);
    
    // Missing punches (clocked in but not out from previous days)
    const yesterday = new Date();
    yesterday.setHours(0,0,0,0);
    yesterday.setDate(yesterday.getDate() - 1);

    return prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        date: { lte: yesterday },
        clockOutTime: null,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } }
      },
      take: 20,
      orderBy: { date: 'desc' }
    });
  }

  // --- Attendance Corrections ---
  async createCorrection(context: ServiceContext, data: any) {
    const tenantId = this.getTenantId(context);
    const employeeId = context.employeeId;
    if (!employeeId) throw new AppError('Employee ID required', 400);

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new AppError('Employee not found', 404);

    return prisma.attendanceCorrection.create({
      data: {
        tenantId,
        organizationId: employee.organizationId,
        employeeId: employee.id,
        managerId: employee.reportingTo,
        date: new Date(data.date),
        requestedClockIn: new Date(data.requestedClockIn),
        requestedClockOut: data.requestedClockOut ? new Date(data.requestedClockOut) : null,
        reason: data.reason
      }
    });
  }

  async listCorrections(context: ServiceContext, organizationId: string, managerId?: string) {
    const tenantId = this.getTenantId(context);
    const whereClause: any = { tenantId, organizationId };

    if (managerId) {
      whereClause.managerId = managerId;
    } else if (context.highestScope === 'SELF') {
      whereClause.employeeId = context.employeeId;
    } else if (context.highestScope === 'TEAM') {
      whereClause.managerId = context.employeeId;
    } else if (context.highestScope !== 'ORGANIZATION' && context.highestScope !== 'PLATFORM') {
      throw new AppError('Insufficient scope to view corrections', 403);
    }

    return prisma.attendanceCorrection.findMany({
      where: whereClause,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveCorrection(context: ServiceContext, correctionId: string) {
    const tenantId = this.getTenantId(context);
    
    return prisma.$transaction(async (tx) => {
      const correction = await tx.attendanceCorrection.findUnique({
        where: { id: correctionId }
      });
      if (!correction || correction.tenantId !== tenantId) throw new AppError('Correction not found', 404);
      if (correction.status !== 'pending') throw new AppError('Correction already processed', 400);

      // Verify manager permission
      if (context.highestScope === 'TEAM' && correction.managerId !== context.employeeId) {
        throw new AppError('Not authorized to approve this correction', 403);
      }

      await tx.attendanceCorrection.update({
        where: { id: correctionId },
        data: { status: 'approved' }
      });

      // Update or create AttendanceRecord
      const existingRecord = await tx.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId: correction.employeeId, date: correction.date } }
      });

      let totalHours = 0;
      if (correction.requestedClockOut) {
        totalHours = (correction.requestedClockOut.getTime() - correction.requestedClockIn.getTime()) / (1000 * 60 * 60);
      }

      if (existingRecord) {
        return tx.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            clockInTime: correction.requestedClockIn,
            clockOutTime: correction.requestedClockOut,
            totalHours
          }
        });
      } else {
        return tx.attendanceRecord.create({
          data: {
            tenantId,
            organizationId: correction.organizationId,
            employeeId: correction.employeeId,
            date: correction.date,
            clockInTime: correction.requestedClockIn,
            clockOutTime: correction.requestedClockOut,
            totalHours,
            status: 'present'
          }
        });
      }
    });
  }

  async rejectCorrection(context: ServiceContext, correctionId: string) {
    const tenantId = this.getTenantId(context);
    const correction = await prisma.attendanceCorrection.findUnique({ where: { id: correctionId } });
    if (!correction || correction.tenantId !== tenantId) throw new AppError('Correction not found', 404);
    if (correction.status !== 'pending') throw new AppError('Correction already processed', 400);

    if (context.highestScope === 'TEAM' && correction.managerId !== context.employeeId) {
      throw new AppError('Not authorized to reject this correction', 403);
    }

    return prisma.attendanceCorrection.update({
      where: { id: correctionId },
      data: { status: 'rejected' }
    });
  }

  async getMonthlyReport(context: ServiceContext, organizationId: string, month: number, year: number) {
    const tenantId = this.getTenantId(context);
    const managerId = context.highestScope === 'TEAM' ? context.employeeId : undefined;
    
    // Find all team members if manager, else all in org
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        organizationId,
        ...(managerId ? { reportingTo: managerId } : {})
      }
    });
    
    const employeeIds = employees.map(e => e.id);
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const records = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        organizationId,
        employeeId: { in: employeeIds },
        date: { gte: startDate, lte: endDate }
      }
    });

    let totalLate = 0;
    let totalEarly = 0;
    let totalHours = 0;
    let totalPresent = records.length;
    
    // Total working days in month excluding weekends (simplistic logic)
    let workingDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
    }

    const employeeBreakdown = employees.map(emp => {
      const empRecords = records.filter(r => r.employeeId === emp.id);
      
      let empLate = 0;
      let empEarly = 0;
      let empHours = 0;
      
      empRecords.forEach(r => {
        empHours += r.totalHours || 0;
        // simplistic late check: > 9:30 AM
        if (r.clockInTime) {
          const ci = new Date(r.clockInTime);
          if (ci.getHours() > 9 || (ci.getHours() === 9 && ci.getMinutes() > 30)) {
            empLate++;
          }
        }
        // simplistic early check: < 5:30 PM
        if (r.clockOutTime) {
          const co = new Date(r.clockOutTime);
          if (co.getHours() < 17 || (co.getHours() === 17 && co.getMinutes() < 30)) {
            empEarly++;
          }
        }
      });
      
      totalLate += empLate;
      totalEarly += empEarly;
      totalHours += empHours;

      return {
        name: `${emp.firstName} ${emp.lastName}`,
        present: empRecords.length,
        absent: Math.max(0, workingDays - empRecords.length),
        late: empLate,
        early: empEarly,
        hours: empRecords.length ? (empHours / empRecords.length).toFixed(1) : '0'
      };
    });

    // Aggregate average metrics
    const avgDailyAttendance = Math.round((totalPresent / (employees.length * workingDays || 1)) * 100);
    const avgLate = (totalLate / (workingDays || 1)).toFixed(1);
    const avgHoursLogged = (totalHours / (totalPresent || 1)).toFixed(1);

    return {
      averageDailyAttendance: avgDailyAttendance,
      averageLateArrivals: avgLate,
      averageHoursLogged: avgHoursLogged,
      breakdown: employeeBreakdown
    };
  }
}
