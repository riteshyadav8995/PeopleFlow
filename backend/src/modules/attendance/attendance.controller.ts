import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class AttendanceController extends BaseController {
  private attendanceService: AttendanceService;

  constructor() {
    super();
    this.attendanceService = new AttendanceService();
  }

  clockIn = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    // get ip from request
    const ipAddress = req.ip || req.socket.remoteAddress;
    const input = { ...req.body, ipAddress };

    const record = await this.attendanceService.clockIn(context, input);
    ApiResponse.success(res, record, 'Clocked in successfully');
  });

  clockOut = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const ipAddress = req.ip || req.socket.remoteAddress;
    const input = { ...req.body, ipAddress };

    const record = await this.attendanceService.clockOut(context, input);
    ApiResponse.success(res, record, 'Clocked out successfully');
  });

  listAttendance = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const organizationId = req.query.organizationId as string;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const managerId = req.query.managerId as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;

    if (!organizationId) {
      throw new Error('organizationId query parameter is required');
    }

    const records = await this.attendanceService.listAttendance(context, organizationId, month, year, managerId, employeeId);
    ApiResponse.success(res, records, 'Attendance retrieved successfully');
  });

  // --- Organization Admin APIs ---

  getMonthlyReport = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const organizationId = req.query.organizationId as string;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    if (!organizationId) {
      throw new Error('organizationId query parameter is required');
    }

    const report = await this.attendanceService.getMonthlyReport(context, organizationId, month, year);
    ApiResponse.success(res, report, 'Monthly attendance report generated');
  });

  getDashboardStats = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;

    if (!organizationId) throw new Error('organizationId query parameter is required');

    const stats = await this.attendanceService.getOrgDashboardStats(context, organizationId);
    ApiResponse.success(res, stats);
  });

  getTrends = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;

    if (!organizationId) throw new Error('organizationId query parameter is required');

    const trends = await this.attendanceService.getOrgAttendanceTrends(context, organizationId);
    ApiResponse.success(res, trends);
  });

  getExceptions = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;

    if (!organizationId) throw new Error('organizationId query parameter is required');

    const exceptions = await this.attendanceService.getOrgExceptions(context, organizationId);
    ApiResponse.success(res, exceptions);
  });

  // --- Corrections APIs ---
  createCorrection = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const correction = await this.attendanceService.createCorrection(context, req.body);
    ApiResponse.success(res, correction, 'Correction request submitted');
  });

  listCorrections = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    const managerId = req.query.managerId as string | undefined;
    const corrections = await this.attendanceService.listCorrections(context, organizationId, managerId);
    ApiResponse.success(res, corrections, 'Corrections retrieved successfully');
  });

  approveCorrection = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.attendanceService.approveCorrection(context, req.params.id as string);
    ApiResponse.success(res, result, 'Correction approved successfully');
  });

  rejectCorrection = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.attendanceService.rejectCorrection(context, req.params.id as string);
    ApiResponse.success(res, result, 'Correction rejected successfully');
  });
}
