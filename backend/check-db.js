require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', tenants.map(t => ({ slug: t.slug, domain: t.domain })));
  
  const orgs = await prisma.organization.findMany();
  console.log('Orgs:', orgs.map(o => o.name));
  
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => u.email));
  
  process.exit(0);
}

check().catch(console.error);
