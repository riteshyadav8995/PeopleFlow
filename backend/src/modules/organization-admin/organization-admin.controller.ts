import { Request, Response, NextFunction } from 'express';
import { OrganizationAdminService } from './organization-admin.service';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { sendOrganizationReportEmail } from '../../shared/utils/mailer';

export class OrganizationAdminController {
  private service: OrganizationAdminService;

  constructor() {
    this.service = new OrganizationAdminService();
  }

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const stats = await this.service.getDashboardStats(authReq.tenantId);
      ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  };

  getPendingApprovals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const approvals = await this.service.getPendingApprovals(authReq.tenantId);
      ApiResponse.success(res, approvals);
    } catch (error) {
      next(error);
    }
  };

  getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const activity = await this.service.getRecentActivity(authReq.tenantId);
      ApiResponse.success(res, activity);
    } catch (error) {
      next(error);
    }
  };

  generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const stats = await this.service.getDashboardStats(authReq.tenantId);
      
      const success = await sendOrganizationReportEmail(
        authReq.user.email,
        'Admin',
        stats
      );

      if (success) {
        ApiResponse.success(res, null, 'Report generated and sent successfully');
      } else {
        res.status(500).json({ success: false, message: 'Failed to send report email' });
      }
    } catch (error) {
      next(error);
    }
  };
}
