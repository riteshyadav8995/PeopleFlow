import { prisma } from './src/core/base/base.model';

async function main() {
  console.log("Starting...");
  const role = await prisma.role.findFirst({ where: { slug: 'employee' } });
  if (!role) {
    console.log("Role not found");
    return;
  }
  
  let p1 = await prisma.permission.findFirst({ where: { resource_action: { resource: 'task.record', action: 'create' } } });
  if (!p1) {
    p1 = await prisma.permission.create({ data: { resource: 'task.record', action: 'create', description: 'Allows create on task.record' } });
  }
  
  let p2 = await prisma.permission.findFirst({ where: { resource_action: { resource: 'task.record', action: 'assign' } } });
  if (!p2) {
    p2 = await prisma.permission.create({ data: { resource: 'task.record', action: 'assign', description: 'Allows assign on task.record' } });
  }
  
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: p1.id } },
    update: {}, create: { roleId: role.id, permissionId: p1.id }
  });
  
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: p2.id } },
    update: {}, create: { roleId: role.id, permissionId: p2.id }
  });
  
  console.log("Permissions added successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
