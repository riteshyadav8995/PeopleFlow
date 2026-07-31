import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class TenantController extends BaseController {
  private tenantService: TenantService;

  constructor() {
    super();
    this.tenantService = new TenantService();
  }

  /**
   * GET /api/v1/tenant
   */
  getTenant = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const tenant = await this.tenantService.getTenant(context);
    ApiResponse.success(res, tenant, 'Tenant retrieved successfully');
  });

  /**
   * PUT /api/v1/tenant
   */
  updateTenant = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const tenant = await this.tenantService.updateTenant(context, req.body);
    ApiResponse.success(res, tenant, 'Tenant updated successfully');
  });
}
