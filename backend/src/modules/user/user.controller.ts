import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class UserController extends BaseController {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  listUsers = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const pagination = (req as any).pagination;
    
    const { data, total } = await this.userService.listUsers(context, pagination);
    
    ApiResponse.success(res, data, 'Users retrieved successfully', { pagination, total });
  });

  getUser = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const user = await this.userService.getUser(context, id);
    ApiResponse.success(res, user, 'User retrieved successfully');
  });

  createUser = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const user = await this.userService.createUser(context, req.body);
    ApiResponse.created(res, user, 'User created successfully');
  });

  updateUser = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const user = await this.userService.updateUser(context, id, req.body);
    ApiResponse.success(res, user, 'User updated successfully');
  });

  deleteUser = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    await this.userService.deleteUser(context, id);
    ApiResponse.success(res, null, 'User deleted successfully');
  });
}
