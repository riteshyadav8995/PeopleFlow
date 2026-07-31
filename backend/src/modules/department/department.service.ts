import { BaseService } from '../../core/base/base.service';
import { DepartmentRepository } from './department.repository';
import { DepartmentCreateInput, DepartmentUpdateInput, DepartmentResponse } from './department.types';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { ConflictError } from '../../core/errors/conflict.error';
import { Department } from '@prisma/client';

export class DepartmentService extends BaseService {
  private repository: DepartmentRepository;

  constructor() {
    super();
    this.repository = new DepartmentRepository();
  }

  private mapToResponse(department: Department): DepartmentResponse {
    const { createdAt, updatedAt, ...rest } = department;
    return rest;
  }

  async createDepartment(context: ServiceContext, input: DepartmentCreateInput): Promise<DepartmentResponse> {
    const tenantId = this.getTenantId(context);
    
    if (input.code) {
      const existing = await this.repository.findByOrganizationId(tenantId, input.organizationId);
      if (existing.some(d => d.code === input.code)) {
        throw new ConflictError('A department with this code already exists in the organization');
      }
    }

    const dept = await this.repository.create(tenantId, input);
    return this.mapToResponse(dept);
  }

  async getDepartment(context: ServiceContext, id: string): Promise<DepartmentResponse> {
    const tenantId = this.getTenantId(context);
    const dept = await this.repository.findById(tenantId, id);
    if (!dept) {
      throw new NotFoundError('Department not found');
    }
    return this.mapToResponse(dept);
  }

  async listDepartmentsByOrg(context: ServiceContext, organizationId: string): Promise<DepartmentResponse[]> {
    const tenantId = this.getTenantId(context);
    const depts = await this.repository.findByOrganizationId(tenantId, organizationId);
    return depts.map(d => this.mapToResponse(d));
  }

  async updateDepartment(context: ServiceContext, id: string, input: DepartmentUpdateInput): Promise<DepartmentResponse> {
    const tenantId = this.getTenantId(context);
    await this.getDepartment(context, id);
    
    const dept = await this.repository.update(tenantId, id, input);
    return this.mapToResponse(dept);
  }

  async deleteDepartment(context: ServiceContext, id: string): Promise<void> {
    const tenantId = this.getTenantId(context);
    await this.getDepartment(context, id);
    await this.repository.delete(tenantId, id);
  }
}
