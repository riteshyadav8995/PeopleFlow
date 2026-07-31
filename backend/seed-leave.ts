import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/core/base/base.model';

async function main() {
  const tenant = await prisma.tenant.findFirst();
  const org = await prisma.organization.findFirst();
  const employee = await prisma.employee.findFirst({
    where: { email: 'rky594237@gmail.com' } // this is the user
  });

  if (!tenant || !org || !employee) {
    console.log("Missing prerequisites");
    return;
  }

  // Ensure leave types exist
  const leaveTypes = ['Casual Leave', 'Sick Leave', 'Marriage Leave'];
  
  for (const typeName of leaveTypes) {
    let leaveType = await prisma.leaveType.findFirst({
      where: { organizationId: org.id, name: typeName }
    });

    if (!leaveType) {
      leaveType = await prisma.leaveType.create({
        data: {
          tenantId: tenant.id,
          organizationId: org.id,
          name: typeName,
          description: typeName,
          defaultDays: 10,
          requiresApproval: true,
          isActive: true
        }
      });
      console.log(`Created Leave Type: ${typeName}`);
    }

    // Ensure employee has balance for this leave type for the current year
    const currentYear = new Date().getFullYear();
    let balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: employee.id, leaveTypeId: leaveType.id, year: currentYear }
    });

    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          tenantId: tenant.id,
          organizationId: org.id,
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: currentYear,
          totalDays: leaveType.defaultDays,
          usedDays: 0,
          pendingDays: 0
        }
      });
      console.log(`Created Leave Balance for ${typeName} for employee`);
    } else {
      console.log(`Leave Balance for ${typeName} already exists`);
    }
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
