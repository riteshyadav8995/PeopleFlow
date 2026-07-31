import { Request, Response, NextFunction } from 'express';
import { PayrollService } from './payroll.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class PayrollController extends BaseController {
  private payrollService = new PayrollService();

  upsertSalaryStructure = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.payrollService.upsertSalaryStructure(context, req.body);
    ApiResponse.success(res, result, 'Salary structure updated successfully');
  });

  getSalaryStructure = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.payrollService.getSalaryStructure(context, req.params.employeeId as string);
    ApiResponse.success(res, result, 'Salary structure retrieved successfully');
  });

  generatePayrollRun = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.payrollService.generatePayrollRun(context, req.body);
    ApiResponse.success(res, result, 'Payroll run generated and CALCULATED.');
  });

  approvePayrollRun = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.payrollService.approvePayrollRun(context, req.params.runId as string);
    ApiResponse.success(res, result, 'Payroll run APPROVED.');
  });

  publishPayrollRun = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const result = await this.payrollService.publishPayrollRun(context, req.params.runId as string);
    ApiResponse.success(res, result, 'Payroll run LOCKED and Payslips published.');
  });

  getPayslips = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const orgId = req.query.organizationId as string | undefined;
    const month = req.query.month as string | undefined;
    const year = req.query.year as string | undefined;
    const managerId = req.query.managerId as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;

    const result = await this.payrollService.getPayslips(
      context, 
      orgId || '', 
      month ? parseInt(month) : undefined, 
      year ? parseInt(year) : undefined,
      managerId,
      employeeId
    );
    ApiResponse.success(res, result, 'Payslips retrieved successfully');
  });
}
