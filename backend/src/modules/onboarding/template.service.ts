import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';

export class TemplateService {
  async createTemplate(context: ServiceContext, data: any) {
    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to create templates', 403);
    }

    if (!context.organizationId) {
      throw new AppError('Organization ID is required', 400);
    }

    return await prisma.onboardingTemplate.create({
      data: {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        tasks: {
          create: data.tasks.map((task: any) => ({
            title: task.title,
            category: task.category, // EMPLOYEE, HR, MANAGER, IT
            isMandatory: task.isMandatory ?? true,
            dueDaysOffset: task.dueDaysOffset || 0
          }))
        }
      },
      include: {
        tasks: true
      }
    });
  }

  async getTemplates(context: ServiceContext, organizationId: string) {
    return await prisma.onboardingTemplate.findMany({
      where: {
        tenantId: context.tenantId,
        organizationId: organizationId
      },
      include: {
        tasks: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
