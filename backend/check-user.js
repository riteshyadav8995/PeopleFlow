import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'rky594237@gmail.com' },
        include: {
            employee: true,
            userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } }
        }
    });
    if (!user) {
        console.log('User not found!');
        return;
    }
    console.log('User ID:', user.id);
    console.log('Has Employee:', !!user.employee);
    console.log('Roles:', user.userRoles.map(ur => ur.role.slug));
    console.log('Permissions:', user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.resource + ':' + rp.permission.action)));
}
main().catch(console.error).finally(() => prisma.$disconnect());
