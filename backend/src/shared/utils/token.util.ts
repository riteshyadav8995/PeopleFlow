import jwt, { JwtPayload } from 'jsonwebtoken';
import { jwtConfig } from '../../config';

export interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  employeeId?: string;
  roles: string[];
  permissions: string[];
  activeWorkspace: 'organization' | 'employee';
}

export const tokenUtil = {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessExpiry as any,
    });
  },

  generateRefreshToken(payload: { userId: string; tenantId: string }): string {
    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiry as any,
    });
  },

  generateActivationToken(userId: string): string {
    return jwt.sign({ userId }, jwtConfig.accessSecret, {
      expiresIn: '3d',
    });
  },

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, jwtConfig.accessSecret) as TokenPayload;
  },

  verifyRefreshToken(token: string): JwtPayload & { userId: string; tenantId: string } {
    return jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload & {
      userId: string;
      tenantId: string;
    };
  },

  verifyActivationToken(token: string): { userId: string } {
    return jwt.verify(token, jwtConfig.accessSecret) as { userId: string };
  },

  generatePasswordResetToken(userId: string): string {
    return jwt.sign({ userId }, jwtConfig.accessSecret, {
      expiresIn: '15m',
    });
  },

  verifyPasswordResetToken(token: string): { userId: string } {
    return jwt.verify(token, jwtConfig.accessSecret) as { userId: string };
  },
};
