import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/core/base/base.model';

async function main() {
  const tenant = await prisma.tenant.findFirst();
  const org = await prisma.organization.findFirst();
  const employee = await prisma.employee.findFirst({
    where: { email: 'rky594237@gmail.com' } // from previous steps, we know the user
  });

  if (!tenant || !org || !employee) {
    console.log("Missing prerequisites");
    return;
  }

  // Check if project exists
  const existingProject = await prisma.project.findFirst({
    where: { tenantId: tenant.id }
  });

  let projectId;

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        organizationId: org.id,
        name: 'Internal HRMS',
        code: 'HRMS-01',
        description: 'Internal project for HR',
        status: 'IN_PROGRESS'
      }
    });
    projectId = project.id;
    console.log("Created new project", project.name);
  } else {
    projectId = existingProject.id;
    console.log("Project already exists", existingProject.name);
  }

  // Ensure employee is a member
  const member = await prisma.projectMember.findFirst({
    where: { projectId, employeeId: employee.id }
  });

  if (!member) {
    await prisma.projectMember.create({
      data: {
        tenantId: tenant.id,
        projectId,
        employeeId: employee.id,
        role: 'DEVELOPER',
        allocation: 100
      }
    });
    console.log("Added employee as member to project");
  } else {
    console.log("Employee is already a member");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
