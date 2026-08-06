import { prisma } from './src/core/base/base.model';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'priyanshu.raj@darwinbox.io' },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('USER ROLES:');
  user.userRoles.forEach(ur => {
    console.log(`Role: ${ur.role.name}`);
    const perms = ur.role.rolePermissions.map(rp => rp.permission.resource + '.' + rp.permission.action);
    console.log(`Permissions (${perms.length}):`);
    console.log(perms.join(', '));
  });
}

main().catch(console.error).finally(() => process.exit(0));
