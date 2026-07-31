import { Request, Response, NextFunction } from 'express';
import { BranchService } from './branch.service';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class BranchController extends BaseController {
  private branchService: BranchService;

  constructor() {
    super();
    this.branchService = new BranchService();
  }

  listBranches = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    let organizationId = req.query.organizationId as string;
    
    if (!organizationId) {
      throw new Error('organizationId query parameter is required');
    }

    // Workaround: if the frontend sends the tenantId as the organizationId,
    // we fetch the actual organization ID for this tenant.
    if (organizationId === context.tenantId) {
      const orgs = await this.branchService['repository']['prisma'].organization.findMany({
        where: { tenantId: context.tenantId }
      });
      if (orgs.length > 0) {
        organizationId = orgs[0].id;
      }
    }

    const data = await this.branchService.listBranchesByOrg(context, organizationId);
    ApiResponse.success(res, data, 'Branches retrieved successfully');
  });

  getBranch = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const branch = await this.branchService.getBranch(context, id);
    ApiResponse.success(res, branch, 'Branch retrieved successfully');
  });

  createBranch = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    
    const branch = await this.branchService.createBranch(context, req.body);
    ApiResponse.created(res, branch, 'Branch created successfully');
  });

  updateBranch = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    const branch = await this.branchService.updateBranch(context, id, req.body);
    ApiResponse.success(res, branch, 'Branch updated successfully');
  });

  deleteBranch = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const id = req.params.id as string;
    
    await this.branchService.deleteBranch(context, id);
    ApiResponse.success(res, null, 'Branch deleted successfully');
  });
}
