require('dotenv').config();
const { prisma } = require('./dist/core/base/base.model');
const { WorkflowService } = require('./dist/modules/onboarding/workflow.service');

const service = new WorkflowService();

async function main() {
  try {
    const context = {
      tenantId: '6b566580-c0b6-4556-9a2c-eecbe9bcfb58', // just a dummy, it will filter by orgId anyway
    };
    const workflows = await service.getWorkflows(context, '836eafb4-7722-4b25-a9e2-509fb7a5d4c0');
    console.log(workflows);
  } catch (error) {
    console.error('FAILED:', error);
  }
}

main().finally(() => prisma.$disconnect());
