import { BaseService } from '../../core/base/base.service';
import { BranchRepository } from './branch.repository';
import { BranchCreateInput, BranchUpdateInput, BranchResponse } from './branch.types';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { ConflictError } from '../../core/errors/conflict.error';
import { Branch } from '@prisma/client';

export class BranchService extends BaseService {
  private repository: BranchRepository;

  constructor() {
    super();
    this.repository = new BranchRepository();
  }

  private mapToResponse(branch: Branch): BranchResponse {
    const { createdAt, updatedAt, ...rest } = branch;
    return rest;
  }

  async createBranch(context: ServiceContext, input: BranchCreateInput): Promise<BranchResponse> {
    const tenantId = this.getTenantId(context);
    
    // Check for existing code in the same org
    if (input.code) {
      const existing = await this.repository.findByOrganizationId(tenantId, input.organizationId);
      if (existing.some(b => b.code === input.code)) {
        throw new ConflictError('A branch with this code already exists in the organization');
      }
    }

    const branch = await this.repository.create(tenantId, input);
    return this.mapToResponse(branch);
  }

  async getBranch(context: ServiceContext, id: string): Promise<BranchResponse> {
    const tenantId = this.getTenantId(context);
    const branch = await this.repository.findById(tenantId, id);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }
    return this.mapToResponse(branch);
  }

  async listBranchesByOrg(context: ServiceContext, organizationId: string): Promise<BranchResponse[]> {
    const tenantId = this.getTenantId(context);
    const branches = await this.repository.findByOrganizationId(tenantId, organizationId);
    return branches.map(b => this.mapToResponse(b));
  }

  async updateBranch(context: ServiceContext, id: string, input: BranchUpdateInput): Promise<BranchResponse> {
    const tenantId = this.getTenantId(context);
    await this.getBranch(context, id); // verify exists
    
    const branch = await this.repository.update(tenantId, id, input);
    return this.mapToResponse(branch);
  }

  async deleteBranch(context: ServiceContext, id: string): Promise<void> {
    const tenantId = this.getTenantId(context);
    await this.getBranch(context, id);
    await this.repository.delete(tenantId, id);
  }
}
