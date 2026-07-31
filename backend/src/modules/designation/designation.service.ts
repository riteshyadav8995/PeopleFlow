import { BaseService } from '../../core/base/base.service';
import { DesignationRepository } from './designation.repository';
import { DesignationCreateInput, DesignationUpdateInput, DesignationResponse } from './designation.types';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { Designation } from '@prisma/client';

export class DesignationService extends BaseService {
  private repository: DesignationRepository;

  constructor() {
    super();
    this.repository = new DesignationRepository();
  }

  private mapToResponse(designation: Designation): DesignationResponse {
    const { createdAt, updatedAt, ...rest } = designation;
    return rest;
  }

  async createDesignation(context: ServiceContext, input: DesignationCreateInput): Promise<DesignationResponse> {
    const tenantId = this.getTenantId(context);
    const designation = await this.repository.create(tenantId, input);
    return this.mapToResponse(designation);
  }

  async getDesignation(context: ServiceContext, id: string): Promise<DesignationResponse> {
    const tenantId = this.getTenantId(context);
    const designation = await this.repository.findById(tenantId, id);
    if (!designation) {
      throw new NotFoundError('Designation not found');
    }
    return this.mapToResponse(designation);
  }

  async listDesignationsByOrg(context: ServiceContext, organizationId: string): Promise<DesignationResponse[]> {
    const tenantId = this.getTenantId(context);
    const designations = await this.repository.findByOrganizationId(tenantId, organizationId);
    return designations.map(d => this.mapToResponse(d));
  }

  async updateDesignation(context: ServiceContext, id: string, input: DesignationUpdateInput): Promise<DesignationResponse> {
    const tenantId = this.getTenantId(context);
    await this.getDesignation(context, id);
    
    const designation = await this.repository.update(tenantId, id, input);
    return this.mapToResponse(designation);
  }

  async deleteDesignation(context: ServiceContext, id: string): Promise<void> {
    const tenantId = this.getTenantId(context);
    await this.getDesignation(context, id);
    await this.repository.delete(tenantId, id);
  }
}
