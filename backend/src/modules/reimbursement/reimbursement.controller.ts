import { Request, Response, NextFunction } from 'express';
import { ReimbursementService } from './reimbursement.service';
import { ApiResponse } from '../../core/responses/api-response';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class ReimbursementController extends BaseController {
  private service: ReimbursementService;

  constructor() {
    super();
    this.service = new ReimbursementService();
  }

  submitClaim = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const claim = await this.service.submitClaim(context, req.query.organizationId as string, req.body);
    ApiResponse.created(res, claim, 'Reimbursement claim submitted successfully');
  });

  getMyClaims = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const claims = await this.service.getMyClaims(context, req.query.organizationId as string);
    ApiResponse.success(res, claims);
  });

  getTeamClaims = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const { organizationId } = req.query;
    if (!organizationId) {
      throw new Error('organizationId is required');
    }
    const result = await this.service.getTeamClaims(context, organizationId as string);
    ApiResponse.success(res, result);
  });

  getAllClaims = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const claims = await this.service.getAllClaims(context, req.query.organizationId as string);
    ApiResponse.success(res, claims);
  });

  updateClaimStatus = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const claim = await this.service.updateClaimStatus(
      context, 
      req.params.id as string, 
      req.body.status as string, 
      req.body.notes as string | undefined
    );
    ApiResponse.success(res, claim, `Claim marked as ${req.body.status}`);
  });
}
