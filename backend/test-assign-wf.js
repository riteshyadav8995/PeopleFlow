const { prisma } = require('./dist/core/base/base.model');
const { WorkflowService } = require('./dist/modules/onboarding/workflow.service');

const service = new WorkflowService();

async function main() {
  const emp = await prisma.employee.findFirst({
    include: { user: true }
  });
  if (!emp) return console.log('No employee found');
  
  const tmpl = await prisma.onboardingTemplate.findFirst({
    where: { tenantId: emp.tenantId }
  });
  if (!tmpl) return console.log('No template found');

  console.log('Assigning workflow for', emp.id, 'with template', tmpl.id);
  
  const context = {
    tenantId: emp.tenantId,
    userId: emp.user.id,
    organizationId: emp.organizationId,
    employeeId: emp.id,
    roles: ['organization_admin'],
    permissions: [],
    highestScope: 'ORGANIZATION'
  };

  try {
    const wf = await service.assignWorkflow(context, { employeeId: emp.id, templateId: tmpl.id });
    console.log('Workflow assigned successfully!', wf.id);
  } catch (error) {
    console.error('Failed to assign workflow:', error);
  }
}
main().finally(() => prisma.$disconnect());
