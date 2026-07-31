import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { PerformanceService } from './performance.service';

export class PerformanceController extends BaseController {
  private service = new PerformanceService();

  // Goals
  getTeamGoals = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.getTeamGoals(context);
    ApiResponse.success(res, result);
  });

  createGoal = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.createGoal(context, req.body);
    ApiResponse.created(res, result);
  });

  deleteGoal = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    await this.service.deleteGoal(context, req.params.id as string);
    ApiResponse.success(res, null, 'Deleted');
  });

  // Feedback
  getTeamFeedback = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.getTeamFeedback(context);
    ApiResponse.success(res, result);
  });

  createFeedback = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.createFeedback(context, req.body);
    ApiResponse.created(res, result);
  });

  deleteFeedback = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    await this.service.deleteFeedback(context, req.params.id as string);
    ApiResponse.success(res, null, 'Deleted');
  });

  // Meetings
  getTeamMeetings = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.getTeamMeetings(context);
    ApiResponse.success(res, result);
  });

  createMeeting = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.createMeeting(context, req.body);
    ApiResponse.created(res, result);
  });

  completeMeeting = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.completeMeeting(context, req.params.id as string);
    ApiResponse.success(res, result);
  });
}
