require('dotenv').config();
const { prisma } = require('./dist/core/base/base.model');
const { LeaveService } = require('./dist/modules/leave/leave.service');

async function run() {
  const org = await prisma.organization.findFirst();
  const tenant = await prisma.tenant.findFirst();
  const service = new LeaveService();
  
  const context = { userId: 'system', tenantId: tenant.id };
  
  const employees = await prisma.employee.findMany();
  console.log('Employees:', employees.map(e => ({ id: e.id, status: e.status, org: e.organizationId, tenant: e.tenantId })));
  console.log('Context org:', org.id, 'tenant:', tenant.id);
  
  // Test monthly
  console.log('Running monthly accrual...');
  const resMonthly = await service.accrueLeaves(context, org.id, 'monthly');
  console.log(resMonthly);

  // Test yearly
  console.log('Running yearly accrual...');
  const resYearly = await service.accrueLeaves(context, org.id, 'yearly');
  console.log(resYearly);
}

run().then(() => {
  console.log('Success');
  process.exit(0);
}).catch(console.error);
