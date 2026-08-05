const { prisma } = require('./dist/core/base/base.model');

async function main() {
  const emps = await prisma.employee.findMany();
  console.log('Employees:');
  emps.forEach(e => {
    console.log(`- ${e.firstName} ${e.lastName} (${e.employeeCode}): ${e.email}`);
  });
}
main().finally(() => prisma.$disconnect());
