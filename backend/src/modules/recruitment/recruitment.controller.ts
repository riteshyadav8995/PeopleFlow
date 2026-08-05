import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { RequisitionService } from './requisition.service';
import { JobService } from './job.service';
import { CandidateService } from './candidate.service';
import { InterviewService } from './interview.service';

export class RecruitmentController extends BaseController {
  private requisitionService = new RequisitionService();
  private jobService = new JobService();
  private candidateService = new CandidateService();
  private interviewService = new InterviewService();

  // --- REQUISITIONS ---
  createRequisition = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const requisition = await this.requisitionService.createRequisition(context, req.body);
    ApiResponse.created(res, requisition, 'Requisition created successfully');
  });

  getRequisitions = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const requisitions = await this.requisitionService.getRequisitions(context, orgId);
    ApiResponse.success(res, requisitions);
  });

  updateRequisitionStatus = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    const { status, reason } = req.body;
    const updated = await this.requisitionService.updateStatus(context, id, status, reason);
    ApiResponse.success(res, updated, `Requisition ${status.toLowerCase()} successfully`);
  });

  // --- JOBS ---
  createJob = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const job = await this.jobService.createJob(context, req.body);
    ApiResponse.created(res, job, 'Job created successfully');
  });

  getJobs = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const jobs = await this.jobService.getJobs(context, orgId);
    ApiResponse.success(res, jobs);
  });

  updateJob = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const updated = await this.jobService.updateJob(context, req.params.id, req.body);
    ApiResponse.success(res, updated, 'Job updated successfully');
  });

  deleteJob = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    await this.jobService.deleteJob(context, req.params.id);
    ApiResponse.success(res, null, 'Job deleted successfully');
  });

  // Public endpoint
  getPublicJobs = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const tenantId = req.query.tenantId as string;
    const orgId = req.query.organizationId as string;
    const jobs = await this.jobService.getPublicJobs(tenantId, orgId);
    ApiResponse.success(res, jobs);
  });

  // --- CANDIDATES & APPLICATIONS ---
  applyForJob = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const tenantId = req.body.tenantId;
    const orgId = req.body.organizationId;
    const jobId = req.params.jobId as string;
    const application = await this.candidateService.applyForJob(tenantId, orgId, jobId, req.body);
    ApiResponse.created(res, application, 'Application submitted successfully');
  });

  getApplications = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const applications = await this.candidateService.getApplications(context, orgId);
    ApiResponse.success(res, applications);
  });

  updateApplicationStage = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    const { stage } = req.body;
    const updated = await this.candidateService.updateApplicationStage(context, id, stage);
    ApiResponse.success(res, updated, 'Stage updated successfully');
  });

  // --- INTERVIEWS ---
  scheduleInterview = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const interview = await this.interviewService.scheduleInterview(context, req.body);
    ApiResponse.created(res, interview, 'Interview scheduled successfully');
  });

  getInterviews = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const interviews = await this.interviewService.getInterviews(context, orgId);
    ApiResponse.success(res, interviews);
  });

  submitInterviewFeedback = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    const updated = await this.interviewService.submitFeedback(context, id, req.body);
    ApiResponse.success(res, updated, 'Feedback submitted successfully');
  });
}
