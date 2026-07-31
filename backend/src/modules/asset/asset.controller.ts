import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { AssetService } from './asset.service';

export class AssetController extends BaseController {
  private service = new AssetService();

  getTeamAssetRequests = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const result = await this.service.getTeamAssetRequests(context);
    ApiResponse.success(res, result);
  });

  updateAssetRequestStatus = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const context = this.getServiceContext(req as AuthenticatedRequest);
    const { status } = req.body;
    const result = await this.service.updateAssetRequestStatus(context, req.params.id as string, status);
    ApiResponse.success(res, result);
  });
}
