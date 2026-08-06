import { prisma } from './src/core/base/base.model';

async function main() {
  console.log('Fetching Employee role...');
  const employeeRole = await prisma.role.findFirst({
    where: { slug: 'employee' }
  });

  if (!employeeRole) {
    console.log('Employee role not found!');
    return;
  }
  
  console.log(`Found role: ${employeeRole.name} (ID: ${employeeRole.id})`);

  const requiredPerms = [
    { resource: 'timesheet.entry', action: 'create' },
    { resource: 'timesheet.submission', action: 'submit' }
  ];

  for (const perm of requiredPerms) {
    // Upsert the permission itself just in case it doesn't exist
    const p = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action
        }
      },
      update: {},
      create: {
        resource: perm.resource,
        action: perm.action,
        description: `Allow ${perm.action} on ${perm.resource}`
      }
    });

    console.log(`Permission ${p.resource}.${p.action} ensures exists (ID: ${p.id}).`);

    // Link it to the Employee role
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: employeeRole.id,
          permissionId: p.id
        }
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        permissionId: p.id
      }
    });
    console.log(`Linked ${p.resource}.${p.action} to Employee role.`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
