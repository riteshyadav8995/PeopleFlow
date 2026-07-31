import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { prisma } from '../../core/base/base.model';

export class AssetService {
  async getTeamAssetRequests(context: ServiceContext) {
    return await prisma.assetRequest.findMany({
      where: {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        employee: {
          reportingTo: context.employeeId
        }
      },
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateAssetRequestStatus(context: ServiceContext, requestId: string, status: string) {
    return await prisma.assetRequest.update({
      where: { id: requestId },
      data: { status }
    });
  }
}
