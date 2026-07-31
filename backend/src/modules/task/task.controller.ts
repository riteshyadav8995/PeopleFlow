import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { AppError } from '../../core/errors/app.error';

export class TaskController extends BaseController {
  private taskService = new TaskService();

  createTask = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const task = await this.taskService.createTask(context, req.body);
    res.status(201).json({ data: task, message: 'Task created successfully' });
  });

  getTasks = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const projectId = req.query.projectId as string | undefined;
    const managerId = req.query.managerId as string | undefined;
    const tasks = await this.taskService.getTasks(context, projectId, managerId);
    res.json({ data: tasks });
  });

  updateTask = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const task = await this.taskService.updateTask(context, req.params.id as string, req.body);
    res.json({ data: task, message: 'Task updated successfully' });
  });

  updateTaskStatus = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const { status } = req.body;
    if (!status) throw new AppError('Status is required', 400);
    const task = await this.taskService.updateTaskStatus(context, req.params.id as string, status);
    res.json({ data: task, message: `Task status updated to ${status}` });
  });

  addComment = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const { content } = req.body;
    if (!content) throw new AppError('Content is required', 400);
    const comment = await this.taskService.addComment(context, req.params.id as string, content);
    res.status(201).json({ data: comment, message: 'Comment added' });
  });
}
