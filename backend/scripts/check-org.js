const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { userRoles: true } });
  console.log("Users:", users.map(u => ({ email: u.email, tenantId: u.tenantId })));
  
  const orgs = await prisma.organization.findMany();
  console.log("Orgs:", orgs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
