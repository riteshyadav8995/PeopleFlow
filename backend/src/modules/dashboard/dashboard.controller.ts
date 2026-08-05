import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponse } from '../../core/responses/api-response';
import { StatusCodes } from 'http-status-codes';

export class DashboardController {
  getEmployeeDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const tenantId = authReq.user.tenantId;
      const organizationId = authReq.user.organizationId || (req.query.organizationId as string);
      const userId = authReq.user.id;
      
      const { prisma } = require('../../core/base/base.model');
      const employee = await prisma.employee.findFirst({
        where: { userId, tenantId }
      });

      if (!organizationId || !employee) {
        ApiResponse.error(res, StatusCodes.BAD_REQUEST, 'Employee profile or Organization ID missing', 'BAD_REQUEST');
        return;
      }

      const data = await dashboardService.getEmployeeDashboard(tenantId, organizationId, employee.id, userId);
      ApiResponse.success(res, data, 'Employee dashboard data retrieved');
    } catch (error) {
      next(error);
    }
  };

  markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const id = req.params.id as string;
      await dashboardService.markNotificationRead(id, authReq.user.id);
      ApiResponse.success(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  };

  seedData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { seedDashboard } = require('../../database/seeders/dashboard');
      await seedDashboard();
      ApiResponse.success(res, null, 'Dashboard seeded successfully');
    } catch (error) {
      next(error);
    }
  };

  getCalendarEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const tenantId = authReq.user.tenantId;
      const organizationId = authReq.user.organizationId || (req.query.organizationId as string);
      const employeeId = authReq.user.employeeId;
      
      const { month, year } = req.query;
      if (!month || !year) {
        ApiResponse.error(res, StatusCodes.BAD_REQUEST, 'Month and year are required', 'BAD_REQUEST');
        return;
      }
      
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);

      const data = await dashboardService.getCalendarEvents(tenantId, organizationId, employeeId, startDate, endDate);
      ApiResponse.success(res, data, 'Calendar events retrieved');
    } catch (error) {
      next(error);
    }
  };

  getManagerProductivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const tenantId = authReq.user.tenantId;
      const organizationId = authReq.user.organizationId || (req.query.organizationId as string);
      const employeeId = authReq.user.employeeId;

      if (!organizationId || !employeeId) {
        ApiResponse.error(res, StatusCodes.BAD_REQUEST, 'Employee profile or Organization ID missing', 'BAD_REQUEST');
        return;
      }

      const data = await dashboardService.getManagerProductivity(tenantId, organizationId, employeeId);
      ApiResponse.success(res, data, 'Manager productivity metrics retrieved');
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
