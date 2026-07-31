import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class DepartmentController extends BaseController {
  private departmentService: DepartmentService;

  constructor() {
    super();
    this.departmentService = new DepartmentService();
  }

  listDepartments = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    let organizationId = req.query.organizationId as string;
    
    if (!organizationId) {
      throw new Error('organizationId query parameter is required');
    }

    if (organizationId === context.tenantId) {
      const orgs = await this.departmentService['repository']['prisma'].organization.findMany({
        where: { tenantId: context.tenantId }
      });
      if (orgs.length > 0) {
        organizationId = orgs[0].id;
      }
    }

    const data = await this.departmentService.listDepartmentsByOrg(context, organizationId);
    ApiResponse.success(res, data, 'Departments retrieved successfully');
  });

  getDepartment = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const dept = await this.departmentService.getDepartment(context, id);
    ApiResponse.success(res, dept, 'Department retrieved successfully');
  });

  createDepartment = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const dept = await this.departmentService.createDepartment(context, req.body);
    ApiResponse.created(res, dept, 'Department created successfully');
  });

  updateDepartment = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const dept = await this.departmentService.updateDepartment(context, id, req.body);
    ApiResponse.success(res, dept, 'Department updated successfully');
  });

  deleteDepartment = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    await this.departmentService.deleteDepartment(context, id);
    ApiResponse.success(res, null, 'Department deleted successfully');
  });
}
