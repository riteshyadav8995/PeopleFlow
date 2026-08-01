import { AuthRepository } from './auth.repository';
import { LoginInput, RegisterInput } from './auth.validation';
import { AuthTokens, LoginResponse, RegisterResponse } from './auth.types';
import { passwordUtil } from '../../shared/utils/password.util';
import { tokenUtil, TokenPayload } from '../../shared/utils/token.util';
import { AuthenticationError } from '../../core/errors/authentication.error';
import { ConflictError } from '../../core/errors/conflict.error';
import { BadRequestError } from '../../core/errors/bad-request.error';
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES } from '../../core/constants/application.constant';
import { SYSTEM_ROLES } from '../../core/constants/role.constant';
import { prisma } from '../../core/base/base.model';
import { logger } from '../../shared/logger/logger';
import crypto from 'crypto';
import * as mailer from '../../shared/utils/mailer';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  // ─── REGISTER ─────────────────────────────

  async register(input: RegisterInput): Promise<RegisterResponse> {
    // Generate a URL-safe slug from the tenant name
    const slug = input.tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      throw new ConflictError('A company with a similar name already exists');
    }

    const passwordHash = await passwordUtil.hash(input.password);

    // Create tenant, user, default role, and assign role in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug,
          status: 'active',
          plan: 'trial',
        },
      });

      // 2. Create user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          status: 'active',
          emailVerifiedAt: new Date(), // Auto-verify for now
        },
      });

      // 3. Create the tenant_admin role
      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Tenant Admin',
          slug: SYSTEM_ROLES.TENANT_ADMIN,
          description: 'Full administrative access to the tenant',
          isSystem: true,
        },
      });

      // 4. Assign role to user
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
          tenantId: tenant.id,
        },
      });

      // 5. Create default organization
      const org = await tx.organization.create({
        data: {
          tenantId: tenant.id,
          name: input.tenantName,
          status: 'active',
        },
      });

      // 6. Create Default Branch (with dummy coordinates)
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          organizationId: org.id,
          name: 'Headquarters',
          code: 'HQ-01',
          latitude: 0.0,
          longitude: 0.0,
          status: 'active'
        }
      });

      // 7. Create Default Department
      const dept = await tx.department.create({
        data: {
          tenantId: tenant.id,
          organizationId: org.id,
          name: 'Management',
          code: 'MGMT'
        }
      });

      // 8. Create Default Designation
      const desig = await tx.designation.create({
        data: {
          tenantId: tenant.id,
          organizationId: org.id,
          departmentId: dept.id,
          title: 'Managing Director'
        }
      });

      // 9. Create Employee Profile for Admin
      await tx.employee.create({
        data: {
          tenantId: tenant.id,
          organizationId: org.id,
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone || '',
          employeeCode: 'EMP-001',
          branchId: branch.id,
          departmentId: dept.id,
          designationId: desig.id,
          employmentType: 'full_time',
          joinDate: new Date(),
          status: 'active',
        }
      });

      return { tenant, user, adminRole };
    });

    // Generate tokens
    const tokens = this.generateTokens({
      userId: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      employeeId: undefined, // Freshly registered org admin hasn't had employee mapped immediately in some flows, but here we did create it! Wait, we created an employee! Let's just use undefined and it will refresh.
      roles: [SYSTEM_ROLES.TENANT_ADMIN],
      permissions: [], // Will be loaded on next login
      activeWorkspace: 'organization',
    });

    // Store refresh token
    await this.storeRefreshToken(result.user.id, tokens.refreshToken);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      tokens,
    };
  }

  // ─── ACTIVATE ──────────────────────────────

  async activateAccount(input: import('./auth.validation').ActivateInput): Promise<{ success: boolean }> {
    let payload;
    try {
      payload = tokenUtil.verifyActivationToken(input.token);
    } catch (e) {
      throw new AuthenticationError('Invalid or expired activation token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.status !== 'pending_verification') {
      throw new ConflictError('Account is already activated or suspended');
    }

    const passwordHash = await passwordUtil.hash(input.password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
    });

    return { success: true };
  }

  // ─── LOGIN ────────────────────────────────

  async login(input: LoginInput, ipAddress: string, userAgent?: string): Promise<LoginResponse> {
    // We need to find the user across all tenants by email
    // In a multi-tenant system, users log in with email and we find their tenant
    const user = await prisma.user.findFirst({
      where: { email: input.email },
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
        employee: true, // Fetch employee to get employeeId
      },
    });

    if (!user) {
      await this.authRepository.recordLoginAttempt({
        email: input.email,
        ipAddress,
        userAgent,
        success: false,
        failReason: 'User not found',
      });
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError(
        `Account is locked. Try again after ${user.lockedUntil.toISOString()}`,
      );
    }

    // Check if account is active
    if (user.status !== 'active' && user.status !== 'locked') {
      throw new AuthenticationError('Account is not active');
    }

    // Verify password
    const isPasswordValid = await passwordUtil.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.authRepository.incrementFailedAttempts(user.id);
      await this.authRepository.recordLoginAttempt({
        userId: user.id,
        email: input.email,
        ipAddress,
        userAgent,
        success: false,
        failReason: 'Invalid password',
      });

      // Lock account if max attempts exceeded
      if (user.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await this.authRepository.lockUser(user.id, lockUntil);
        throw new AuthenticationError(
          `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes`,
        );
      }

      throw new AuthenticationError('Invalid email or password');
    }

    // Success — reset failed attempts
    await this.authRepository.updateLoginSuccess(user.id);
    await this.authRepository.recordLoginAttempt({
      userId: user.id,
      email: input.email,
      ipAddress,
      userAgent,
      success: true,
    });

    // Determine default workspace
    let activeWorkspace: 'organization' | 'employee' = 'employee';
    if (user.userRoles.some(ur => ur.role.slug === SYSTEM_ROLES.TENANT_ADMIN || ur.role.slug === SYSTEM_ROLES.HR_MANAGER)) {
      activeWorkspace = 'organization';
    }
    // If they have no employee record, they must be in organization workspace
    if (!user.employee) {
      activeWorkspace = 'organization';
    }

    const { filteredRoles, filteredPermissions } = this.filterRolesAndPermissions(user, activeWorkspace);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      employeeId: user.employee?.id,
      roles: filteredRoles,
      permissions: filteredPermissions,
      activeWorkspace,
    });

    const defaultOrganization = await prisma.organization.findFirst({
      where: { tenantId: user.tenantId }
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        organizationId: defaultOrganization?.id,
        roles: filteredRoles,
        permissions: filteredPermissions,
        employeeId: user.employee?.id,
        hasEmployeeProfile: !!user.employee,
      },
      tokens,
    };
  }

  // ─── REFRESH TOKEN ────────────────────────

  async refreshToken(refreshTokenValue: string): Promise<AuthTokens> {
    const storedToken = await this.authRepository.findRefreshToken(refreshTokenValue);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Revoke the old token (rotation)
    await this.authRepository.revokeRefreshToken(refreshTokenValue);

    // Load user with roles/permissions
    const user = await this.authRepository.findUserById(storedToken.userId);
    if (!user || user.status !== 'active') {
      throw new AuthenticationError('User account is not active');
    }

    const decodedOldToken = tokenUtil.verifyRefreshToken(refreshTokenValue) as any;
    const oldAccessWorkspace = decodedOldToken.activeWorkspace || 'employee';

    const { filteredRoles, filteredPermissions } = this.filterRolesAndPermissions(user, oldAccessWorkspace);

    const employee = user.employee;

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      employeeId: employee?.id,
      roles: filteredRoles,
      permissions: filteredPermissions,
      activeWorkspace: oldAccessWorkspace,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ─── SWITCH WORKSPACE ─────────────────────

  async switchWorkspace(userId: string, targetWorkspace: 'organization' | 'employee'): Promise<LoginResponse> {
    const user = await this.authRepository.findUserById(userId);
    if (!user || user.status !== 'active') {
      throw new AuthenticationError('User account is not active');
    }

    if (targetWorkspace === 'employee' && !user.employee) {
      throw new AuthenticationError('You do not have an active employee profile to access this workspace.');
    }

    const { filteredRoles, filteredPermissions } = this.filterRolesAndPermissions(user, targetWorkspace);

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      employeeId: user.employee?.id,
      roles: filteredRoles,
      permissions: filteredPermissions,
      activeWorkspace: targetWorkspace,
    });

    // Revoke all existing refresh tokens (optional, but let's just issue a new one and they can overwrite)
    // Actually, maybe we just issue a new pair and let them use it
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Audit log
    await prisma.systemAuditLog.create({
      data: {
        userId: user.id,
        action: 'SWITCH_WORKSPACE',
        details: { targetWorkspace },
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        roles: filteredRoles,
        permissions: filteredPermissions,
        hasEmployeeProfile: !!user.employee,
      },
      tokens,
    };
  }

  // ─── LOGOUT ───────────────────────────────

  async logout(refreshTokenValue: string): Promise<void> {
    try {
      await this.authRepository.revokeRefreshToken(refreshTokenValue);
    } catch {
      // Silently ignore if token doesn't exist
      logger.debug('Logout attempted with non-existent refresh token');
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.revokeAllUserTokens(userId);
  }

  // ─── FORGOT & RESET PASSWORD ────────────────
  
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      // Return success to avoid email enumeration
      return;
    }

    const resetToken = tokenUtil.generatePasswordResetToken(user.id);
    const resetUrl = `${process.env.FRONTEND_URL || 'https://people-flow-rose.vercel.app'}/reset-password?token=${resetToken}`;

    await mailer.sendPasswordResetEmail(user.email, resetUrl);
    logger.info(`Password reset email sent to ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = tokenUtil.verifyPasswordResetToken(token);
      
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        throw new BadRequestError('Invalid or expired password reset token');
      }

      const passwordHash = await passwordUtil.hash(newPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Optionally revoke all tokens so they must log in again
      await this.authRepository.revokeAllUserTokens(user.id);
      logger.info(`Password reset successfully for user ${user.id}`);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestError('Password reset token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestError('Invalid password reset token');
      }
      throw error;
    }
  }

  // ─── HELPERS ──────────────────────────────

  private filterRolesAndPermissions(user: any, workspace: 'organization' | 'employee') {
    const orgRoles = [SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.TENANT_ADMIN, SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.FINANCE_MANAGER, SYSTEM_ROLES.RECRUITER];
    
    let activeUserRoles = user.userRoles;
    
    if (workspace === 'organization') {
      // Keep only org-level roles (or keep all, but standard is keep org roles)
      activeUserRoles = user.userRoles.filter((ur: any) => orgRoles.includes(ur.role.slug as any));
      // Fallback if none match (e.g. custom roles might not be in orgRoles constant)
      if (activeUserRoles.length === 0 && user.userRoles.length > 0) activeUserRoles = user.userRoles;
    } else {
      // Keep employee roles
      activeUserRoles = user.userRoles.filter((ur: any) => !orgRoles.includes(ur.role.slug as any));
      // Fallback
      if (activeUserRoles.length === 0) {
        // If they have no explicit employee role, maybe they rely on generic permissions, so give them nothing or a default
        activeUserRoles = []; 
      }
    }

    const filteredRoles = activeUserRoles.map((ur: any) => ur.role.slug);
    const filteredPermissions = [
      ...new Set(
        activeUserRoles.flatMap((ur: any) =>
          ur.role.rolePermissions.map(
            (rp: any) => `${rp.permission.resource}:${rp.permission.action}`,
          ),
        ),
      ),
    ];

    // Give base employee permissions if in employee workspace and they have an employee record
    if (workspace === 'employee' && user.employee) {
      if (!filteredRoles.includes('employee')) filteredRoles.push('employee');
      
      const selfPermissions = [
        'attendance.self:read',
        'attendance.self:mark',
        'leave.self:read',
        'leave.self:request',
        'leave.self:manage',
        'leave.request:read',
        'leave.request:create',
        'payroll.self:view',
        'payslip.record:read',
        'employee.record:read',
        'profile.self:view',
        'profile.self:update',
        'task.record.read',
        'task.record.create',
        'task.record.update',
        'task.comment.create',
        'project.record.read'
      ];
      
      selfPermissions.forEach(perm => {
        if (!filteredPermissions.includes(perm)) {
          filteredPermissions.push(perm);
        }
      });
    }

    return { filteredRoles, filteredPermissions: filteredPermissions as string[] };
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    return {
      accessToken: tokenUtil.generateAccessToken(payload),
      refreshToken: tokenUtil.generateRefreshToken({
        userId: payload.userId,
        tenantId: payload.tenantId,
        activeWorkspace: payload.activeWorkspace,
      } as any),
    };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Hash the refresh token before storing for security
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Calculate expiry (7 days default)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken({
      userId,
      token: hashedToken,
      expiresAt,
      ipAddress,
      userAgent,
    });
  }
}
