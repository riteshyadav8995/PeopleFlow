import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../core/responses/api-response';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      ApiResponse.created(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/activate
   */
  activateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.activateAccount(req.body);
      ApiResponse.success(res, result, 'Account activated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];
      const result = await this.authService.login(req.body, ipAddress, userAgent);
      ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);
      ApiResponse.success(res, tokens, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/switch-workspace
   */
  switchWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { targetWorkspace } = req.body;
      const result = await this.authService.switchWorkspace(authReq.user.id, targetWorkspace);
      ApiResponse.success(res, result, 'Workspace switched successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/logout-all (requires auth)
   */
  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      await this.authService.logoutAll(authReq.user.id);
      ApiResponse.success(res, null, 'All sessions terminated');
    } catch (error) {
      next(error);
    }
  };
}
