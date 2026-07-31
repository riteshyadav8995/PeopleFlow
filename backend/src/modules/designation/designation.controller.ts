import { Request, Response, NextFunction } from 'express';
import { DesignationService } from './designation.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class DesignationController extends BaseController {
  private designationService: DesignationService;

  constructor() {
    super();
    this.designationService = new DesignationService();
  }

  listDesignations = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    let organizationId = req.query.organizationId as string;
    
    if (!organizationId) {
      throw new Error('organizationId query parameter is required');
    }

    if (organizationId === context.tenantId) {
      const orgs = await this.designationService['repository']['prisma'].organization.findMany({
        where: { tenantId: context.tenantId }
      });
      if (orgs.length > 0) {
        organizationId = orgs[0].id;
      }
    }

    const data = await this.designationService.listDesignationsByOrg(context, organizationId);
    ApiResponse.success(res, data, 'Designations retrieved successfully');
  });

  getDesignation = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const designation = await this.designationService.getDesignation(context, id);
    ApiResponse.success(res, designation, 'Designation retrieved successfully');
  });

  createDesignation = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const designation = await this.designationService.createDesignation(context, req.body);
    ApiResponse.created(res, designation, 'Designation created successfully');
  });

  updateDesignation = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const designation = await this.designationService.updateDesignation(context, id, req.body);
    ApiResponse.success(res, designation, 'Designation updated successfully');
  });

  deleteDesignation = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    await this.designationService.deleteDesignation(context, id);
    ApiResponse.success(res, null, 'Designation deleted successfully');
  });
}
