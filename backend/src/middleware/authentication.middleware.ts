import { Request, Response, NextFunction } from 'express';
import { tokenUtil, TokenPayload } from '../shared/utils/token.util';
import { AuthenticationError } from '../core/errors/authentication.error';
import { AuthenticatedRequest } from '../core/interfaces/authenticated-request.interface';

/**
 * Authentication middleware — verifies JWT access token from
 * the Authorization header and populates req.user.
 */
export function authenticationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('Access token is malformed');
    }

    const payload: TokenPayload = tokenUtil.verifyAccessToken(token);

    // Attach user context to request
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      roles: payload.roles,
      permissions: payload.permissions,
    };
    (req as AuthenticatedRequest).tenantId = payload.tenantId;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid or expired access token'));
    }
  }
}
