require('dotenv').config();
const { prisma } = require('./dist/core/base/base.model');

async function main() {
  const tenant = await prisma.tenant.findFirst();
  const org = await prisma.organization.findFirst();
  const employee = await prisma.employee.findFirst({ where: { email: 'rky594237@gmail.com' } });
  
  if (!tenant || !org || !employee) {
    console.log("Missing prerequisites");
    return;
  }

  const leaveTypes = ['Casual Leave', 'Sick Leave', 'Marriage Leave', 'Earned Leave'];
  for (const typeName of leaveTypes) {
    let leaveType = await prisma.leaveType.findFirst({ where: { organizationId: org.id, name: typeName } });
    
    if (!leaveType) {
      let code = typeName.split(' ').map(w => w[0]).join('').toUpperCase();
      if (typeName === 'Earned Leave') code = 'EL';
      if (typeName === 'Casual Leave') code = 'CL';
      if (typeName === 'Sick Leave') code = 'SL';
      if (typeName === 'Marriage Leave') code = 'ML';

      leaveType = await prisma.leaveType.create({
        data: { 
          tenantId: tenant.id, 
          organizationId: org.id, 
          name: typeName, 
          code: code,
          description: typeName, 
          daysPerYear: 10,
          isActive: true 
        }
      });
      console.log(`Created Leave Type: ${typeName}`);
    }

    let balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: employee.id, leaveTypeId: leaveType.id, year: new Date().getFullYear() }
    });

    if (!balance) {
      await prisma.leaveBalance.create({
        data: { 
          tenantId: tenant.id, 
          employeeId: employee.id, 
          leaveTypeId: leaveType.id, 
          year: new Date().getFullYear(), 
          totalDays: 10, 
          usedDays: 0, 
          pendingDays: 0 
        }
      });
      console.log(`Created Leave Balance for ${typeName}`);
    }
  }
}

main()
  .then(() => console.log('Seed completed successfully'))
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
