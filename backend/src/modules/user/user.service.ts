import { UserRepository } from './user.repository';
import { CreateUserInput, UpdateUserInput } from './user.validation';
import { UserResponse } from './user.types';
import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { ConflictError } from '../../core/errors/conflict.error';
import { passwordUtil } from '../../shared/utils/password.util';
import { ParsedPagination } from '../../shared/utils/pagination.util';
import crypto from 'crypto';

export class UserService extends BaseService {
  private repository: UserRepository;

  constructor() {
    super();
    this.repository = new UserRepository();
  }

  private mapToResponse(user: any): UserResponse {
    const { passwordHash, tenantId, emailVerifiedAt, userRoles, ...rest } = user;
    return {
      ...rest,
      roles: userRoles ? userRoles.map((ur: any) => ur.role.slug) : []
    };
  }

  async listUsers(context: ServiceContext, pagination: ParsedPagination) {
    const tenantId = this.getTenantId(context);
    const { data, total } = await this.repository.list(tenantId, pagination);
    
    return {
      data: data.map(this.mapToResponse),
      total
    };
  }

  async getUser(context: ServiceContext, id: string): Promise<UserResponse> {
    const tenantId = this.getTenantId(context);
    const user = await this.repository.findById(tenantId, id);
    
    if (!user) {
      throw new NotFoundError('User', id);
    }
    
    return this.mapToResponse(user);
  }

  async createUser(context: ServiceContext, input: CreateUserInput): Promise<UserResponse> {
    const tenantId = this.getTenantId(context);
    
    const existingUser = await this.repository.findByEmail(tenantId, input.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists in this tenant');
    }

    // Generate random temporary password if user is created by admin
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const passwordHash = await passwordUtil.hash(tempPassword);

    const user = await this.repository.create({
      tenant: { connect: { id: tenantId } },
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      status: 'active'
    }, input.roles);
    
    return this.mapToResponse(user);
  }

  async updateUser(context: ServiceContext, id: string, input: UpdateUserInput): Promise<UserResponse> {
    const tenantId = this.getTenantId(context);
    
    // Ensure user exists
    await this.getUser(context, id);

    const updateData: any = {};
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.status) updateData.status = input.status;

    const user = await this.repository.update(tenantId, id, updateData, input.roles);
    
    return this.mapToResponse(user);
  }

  async deleteUser(context: ServiceContext, id: string): Promise<void> {
    const tenantId = this.getTenantId(context);
    
    // Ensure user exists
    await this.getUser(context, id);
    
    await this.repository.delete(tenantId, id);
  }
}
