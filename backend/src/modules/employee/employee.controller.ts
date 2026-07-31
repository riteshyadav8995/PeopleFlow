import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class EmployeeController extends BaseController {
  private employeeService: EmployeeService;

  constructor() {
    super();
    this.employeeService = new EmployeeService();
  }

  listEmployees = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;
    const managerId = req.query.managerId as string | undefined;
    
    if (!organizationId) {
      throw new Error('organizationId query parameter is required');
    }

    const data = await this.employeeService.listEmployeesByOrg(context, organizationId, managerId);
    ApiResponse.success(res, data, 'Employees retrieved successfully');
  });

  getEmployee = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const employee = await this.employeeService.getEmployee(context, id);
    ApiResponse.success(res, employee, 'Employee retrieved successfully');
  });

  createEmployee = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const employee = await this.employeeService.createEmployee(context, req.body);
    ApiResponse.created(res, employee, 'Employee created successfully');
  });

  updateEmployee = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const employee = await this.employeeService.updateEmployee(context, id, req.body);
    ApiResponse.success(res, employee, 'Employee updated successfully');
  });

  deleteEmployee = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    await this.employeeService.deleteEmployee(context, id);
    ApiResponse.success(res, null, 'Employee deleted successfully');
  });

  getTeamMetrics = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      throw new Error('organizationId query parameter is required');
    }

    const metrics = await this.employeeService.getTeamMetrics(context, organizationId);
    ApiResponse.success(res, metrics, 'Team metrics retrieved successfully');
  });
}
