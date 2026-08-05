import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';

export class TemplateService {
  async createTemplate(context: ServiceContext, data: any) {
    if (context.highestScope !== 'PLATFORM' && context.highestScope !== 'ORGANIZATION') {
      throw new AppError('Unauthorized to create templates', 403);
    }

    // organizationId can come from context (JWT) or from the request body
    const orgId = context.organizationId || data.organizationId;

    if (!orgId) {
      throw new AppError('Organization ID is required', 400);
    }

    return await prisma.onboardingTemplate.create({
      data: {
        tenantId: context.tenantId,
        organizationId: orgId,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        tasks: {
          create: (data.tasks || []).map((task: any) => ({
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

  async updateTemplate(context: ServiceContext, id: string, data: any) {
    const template = await prisma.onboardingTemplate.findFirst({
      where: { id, tenantId: context.tenantId }
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // A full update would delete old tasks and recreate new ones, 
    // or we can just update the basic info for now depending on data passed
    const updateData: any = {
      name: data.name,
      description: data.description,
      isActive: data.isActive
    };

    if (data.tasks) {
      // simplified: delete all tasks and recreate
      updateData.tasks = {
        deleteMany: {},
        create: data.tasks.map((task: any) => ({
          title: task.title,
          category: task.category,
          isMandatory: task.isMandatory ?? true,
          dueDaysOffset: task.dueDaysOffset || 0
        }))
      };
    }

    return await prisma.onboardingTemplate.update({
      where: { id },
      data: updateData,
      include: { tasks: true }
    });
  }

  async deleteTemplate(context: ServiceContext, id: string) {
    const template = await prisma.onboardingTemplate.findFirst({
      where: { id, tenantId: context.tenantId }
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    await prisma.onboardingTaskTemplate.deleteMany({
      where: { templateId: id }
    });

    await prisma.onboardingTemplate.delete({
      where: { id }
    });

    return { message: 'Template deleted successfully' };
  }
}
