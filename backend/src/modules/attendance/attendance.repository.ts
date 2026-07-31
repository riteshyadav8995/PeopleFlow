import { BaseRepository } from '../../core/base/base.repository';
import { AttendanceRecord } from '@prisma/client';

export class AttendanceRepository extends BaseRepository {
  async getTodayRecord(employeeId: string, date: Date): Promise<AttendanceRecord | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
  }

  async clockIn(data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttendanceRecord> {
    return this.prisma.attendanceRecord.create({
      data
    });
  }

  async clockOut(id: string, clockOutTime: Date, totalHours: number): Promise<AttendanceRecord> {
    return this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        clockOutTime,
        totalHours
      }
    });
  }

  async findByEmployee(employeeId: string, organizationId: string, month: number, year: number): Promise<AttendanceRecord[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        organizationId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    });
  }
}
