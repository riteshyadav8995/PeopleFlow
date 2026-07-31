import { TenantRepository } from './tenant.repository';
import { UpdateTenantInput } from './tenant.validation';
import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { NotFoundError } from '../../core/errors/not-found.error';
import { Tenant } from '@prisma/client';

export class TenantService extends BaseService {
  private repository: TenantRepository;

  constructor() {
    super();
    this.repository = new TenantRepository();
  }

  async getTenant(context: ServiceContext): Promise<Tenant> {
    const tenantId = this.getTenantId(context);
    const tenant = await this.repository.findById(tenantId);
    
    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }
    
    return tenant;
  }

  async updateTenant(context: ServiceContext, input: UpdateTenantInput): Promise<Tenant> {
    const tenantId = this.getTenantId(context);
    
    // Ensure tenant exists
    await this.getTenant(context);

    // Cast JSON fields appropriately
    const updateData: any = { ...input };
    
    return this.repository.update(tenantId, updateData);
  }
}
