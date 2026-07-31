import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { AppError } from '../../core/errors/app.error';

export class ProjectController extends BaseController {
  private projectService = new ProjectService();

  createProject = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const project = await this.projectService.createProject(context, req.body);
    res.status(201).json({ data: project, message: 'Project created successfully' });
  });

  getProjects = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string | undefined;
    const projects = await this.projectService.getProjects(context, organizationId);
    res.json({ data: projects });
  });

  getProjectDetails = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const project = await this.projectService.getProjectDetails(context, req.params.id as string);
    res.json({ data: project });
  });

  updateProjectStatus = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const { status } = req.body;
    if (!status) throw new AppError('Status is required', 400);
    const project = await this.projectService.updateProjectStatus(context, req.params.id as string, status);
    res.json({ data: project, message: `Project status updated to ${status}` });
  });

  addProjectMember = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const member = await this.projectService.addProjectMember(context, req.params.id as string, req.body);
    res.status(201).json({ data: member, message: 'Member added to project' });
  });
}

