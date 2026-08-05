import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { TemplateService } from './template.service';
import { WorkflowService } from './workflow.service';

export class OnboardingController extends BaseController {
  private templateService = new TemplateService();
  private workflowService = new WorkflowService();

  // --- TEMPLATES ---
  createTemplate = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const template = await this.templateService.createTemplate(context, req.body);
    ApiResponse.created(res, template, 'Template created successfully');
  });

  getTemplates = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const templates = await this.templateService.getTemplates(context, orgId);
    ApiResponse.success(res, templates);
  });

  updateTemplate = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const template = await this.templateService.updateTemplate(context, req.params.id, req.body);
    ApiResponse.success(res, template, 'Template updated successfully');
  });

  deleteTemplate = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.templateService.deleteTemplate(context, req.params.id);
    ApiResponse.success(res, result, 'Template deleted successfully');
  });

  // --- WORKFLOWS ---
  assignWorkflow = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const workflow = await this.workflowService.assignWorkflow(context, req.body);
    ApiResponse.created(res, workflow, 'Workflow assigned successfully');
  });

  getWorkflows = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string;
    const workflows = await this.workflowService.getWorkflows(context, orgId);
    ApiResponse.success(res, workflows);
  });

  // --- TASKS ---
  getMyTasks = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const tasks = await this.workflowService.getMyTasks(context);
    ApiResponse.success(res, tasks);
  });

  completeTask = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    const updated = await this.workflowService.completeTask(context, id);
    ApiResponse.success(res, updated, 'Task completed successfully');
  });
}
