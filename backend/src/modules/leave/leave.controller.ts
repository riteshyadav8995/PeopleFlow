import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './leave.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class LeaveController extends BaseController {
  private leaveService: LeaveService;

  constructor() {
    super();
    this.leaveService = new LeaveService();
  }

  getTypes = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    
    const types = await this.leaveService.getLeaveTypes(context, orgId);
    ApiResponse.success(res, types);
  });

  getMyBalances = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    const balances = await this.leaveService.getMyLeaveBalances(context, orgId, year);
    ApiResponse.success(res, balances);
  });

  requestLeave = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const request = await this.leaveService.requestLeave(context, req.body);
    ApiResponse.success(res, request, 'Leave request submitted successfully');
  });

  getMyRequests = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    
    const requests = await this.leaveService.getMyRequests(context, orgId);
    ApiResponse.success(res, requests);
  });

  getPendingApprovals = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    
    const approvals = await this.leaveService.getPendingApprovals(context, orgId);
    ApiResponse.success(res, approvals);
  });

  getTeamRequests = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const status = req.query.status as string;
    
    const requests = await this.leaveService.getTeamRequests(context, orgId, status);
    ApiResponse.success(res, requests);
  });

  reviewLeave = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;
    
    const updated = await this.leaveService.reviewLeave(context, id, status, rejectionReason);
    ApiResponse.success(res, updated, `Leave ${status} successfully`);
  });

  // --- Organization Admin APIs ---

  getOrgDashboardStats = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;

    if (!organizationId) throw new Error('organizationId query parameter is required');

    const stats = await this.leaveService.getOrgLeaveDashboardStats(context, organizationId);
    ApiResponse.success(res, stats);
  });

  getOrgLeaveRequests = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = req.query.search as string;

    if (!organizationId) throw new Error('organizationId query parameter is required');

    const requests = await this.leaveService.getOrgLeaveRequests(context, organizationId, { status, type, search });
    ApiResponse.success(res, requests);
  });

  getOrgLeaveCalendar = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    if (!organizationId) throw new Error('organizationId query parameter is required');

    const calendar = await this.leaveService.getOrgLeaveCalendar(context, organizationId, month, year);
    ApiResponse.success(res, calendar);
  });

  getMonthlyLeaveTrend = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    if (!organizationId) throw new Error('organizationId query parameter is required');
    
    const trend = await this.leaveService.getMonthlyLeaveTrend(context, organizationId, year);
    ApiResponse.success(res, trend);
  });

  getDepartmentLeaveDistribution = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    if (!organizationId) throw new Error('organizationId query parameter is required');
    
    const dist = await this.leaveService.getDepartmentLeaveDistribution(context, organizationId);
    ApiResponse.success(res, dist);
  });

  getDepartmentSummary = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    if (!organizationId) throw new Error('organizationId query parameter is required');
    
    const summary = await this.leaveService.getDepartmentSummary(context, organizationId, year);
    ApiResponse.success(res, summary);
  });

  getLeavePolicies = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    if (!organizationId) throw new Error('organizationId query parameter is required');
    
    const policies = await this.leaveService.getLeaveTypes(context, organizationId);
    ApiResponse.success(res, policies);
  });

  createLeavePolicy = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const policy = await this.leaveService.createLeavePolicy(context, req.body);
    ApiResponse.created(res, policy);
  });

  getUpcomingEvents = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    if (!organizationId) throw new Error('organizationId query parameter is required');
    
    const events = await this.leaveService.getUpcomingEvents(context, organizationId);
    ApiResponse.success(res, events);
  });

  getLeaveBalanceExceptions = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    if (!organizationId) throw new Error('organizationId query parameter is required');
    
    const exceptions = await this.leaveService.getLeaveBalanceExceptions(context, organizationId);
    ApiResponse.success(res, exceptions);
  });

  accrueLeaves = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const { organizationId, type } = req.body;
    if (!organizationId || !type) throw new Error('organizationId and type are required in body');
    
    const result = await this.leaveService.accrueLeaves(context, organizationId, type);
    ApiResponse.success(res, result);
  });
}
