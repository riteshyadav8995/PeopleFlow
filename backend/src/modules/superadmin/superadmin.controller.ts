import { Request, Response, NextFunction } from 'express';
import { SuperAdminService } from './superadmin.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class SuperAdminController extends BaseController {
  private superAdminService = new SuperAdminService();

  getDashboard = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.getPlatformDashboard(context);
    ApiResponse.success(res, data, 'Dashboard metrics retrieved');
  });

  getPlatformUsage = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.getPlatformUsage(context);
    ApiResponse.success(res, data, 'Platform usage retrieved');
  });

  getSystemHealth = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.getSystemHealth(context);
    ApiResponse.success(res, data, 'System health retrieved');
  });

  getRecentActivity = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.getRecentActivity(context);
    ApiResponse.success(res, data, 'Recent activity retrieved');
  });

  getSecurityAlerts = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.getSecurityAlerts(context);
    ApiResponse.success(res, data, 'Security alerts retrieved');
  });

  listOrganizations = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.listAllOrganizations(context);
    ApiResponse.success(res, data, 'Organizations retrieved');
  });

  createOrganization = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.createOrganization(context, req.body);
    ApiResponse.created(res, data, 'Organization created successfully');
  });

  getOrganization = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.getOrganizationDetails(context, req.params.id as string);
    ApiResponse.success(res, data, 'Organization details retrieved');
  });

  updateOrgStatus = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.updateOrganizationStatus(context, req.params.id as string, req.body.status);
    ApiResponse.success(res, data, 'Organization status updated');
  });

  deleteOrganization = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    await this.superAdminService.deleteOrganization(context, req.params.id as string);
    ApiResponse.success(res, null, 'Organization deleted successfully');
  });

  listPlans = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.listSubscriptionPlans(context);
    ApiResponse.success(res, data, 'Subscription plans retrieved');
  });

  createPlan = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.createSubscriptionPlan(context, req.body);
    ApiResponse.created(res, data, 'Subscription plan created');
  });

  updatePlan = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.updateSubscriptionPlan(context, req.params.id as string, req.body);
    ApiResponse.success(res, data, 'Subscription plan updated');
  });

  listIntegrations = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.listIntegrations(context);
    ApiResponse.success(res, data, 'Integrations retrieved');
  });

  addIntegration = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.addIntegration(context, req.body);
    ApiResponse.created(res, data, 'Integration added');
  });

  listJobs = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.listJobs(context);
    ApiResponse.success(res, data, 'Jobs retrieved');
  });

  retryJob = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.retryJob(context, req.params.jobId as string);
    ApiResponse.success(res, data, 'Job retry initiated');
  });

  cancelJob = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.cancelJob(context, req.params.jobId as string);
    ApiResponse.success(res, data, 'Job cancelled');
  });

  listSupportTickets = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.listSupportTickets(context);
    ApiResponse.success(res, data, 'Support tickets retrieved');
  });

  assignTicket = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.assignTicket(context, req.params.ticketId as string, req.body.assigneeId);
    ApiResponse.success(res, data, 'Ticket assigned');
  });

  startImpersonation = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.startImpersonation(context, req.body);
    ApiResponse.success(res, data, 'Impersonation session started');
  });

  endImpersonation = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const data = await this.superAdminService.endImpersonation(context, req.params.sessionId as string);
    ApiResponse.success(res, data, 'Impersonation session ended');
  });
}
