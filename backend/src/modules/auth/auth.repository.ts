import { BaseRepository } from '../../core/base/base.repository';

export class AuthRepository extends BaseRepository {
  // ─── Refresh Tokens ────────────────────────

  async createRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async revokeRefreshToken(token: string) {
    return this.prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpiredTokens() {
    return this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ─── Login Attempts ────────────────────────

  async recordLoginAttempt(data: {
    userId?: string;
    email: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    failReason?: string;
  }) {
    return this.prisma.loginAttempt.create({ data });
  }

  async getRecentFailedAttempts(email: string, since: Date): Promise<number> {
    return this.prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: { gte: since },
      },
    });
  }

  // ─── User Lookup ───────────────────────────

  async findUserByEmail(tenantId: string, email: string) {
    return this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        employee: true,
      },
    });
  }

  async updateLoginSuccess(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async incrementFailedAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
    });
  }

  async lockUser(userId: string, until: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: until,
        status: 'locked',
      },
    });
  }
}
