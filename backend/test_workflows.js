const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const workflows = await prisma.onboardingWorkflow.findMany();
  console.log('Workflows:', workflows.length);
  const tasks = await prisma.onboardingTask.findMany();
  console.log('Tasks:', tasks.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
