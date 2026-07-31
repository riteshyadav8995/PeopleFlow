import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../../core/base/base.model';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting database seeding...');

  // 1. Create System Tenant
  const systemTenant = await prisma.tenant.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'System',
      slug: 'system',
      status: 'active',
      plan: 'enterprise'
    }
  });

  // 2. Create Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { 
      tenantId_slug: { tenantId: systemTenant.id, slug: 'super_admin' }
    },
    update: {},
    create: {
      tenantId: systemTenant.id,
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'System level super administrator',
      isSystem: true
    }
  });

  // 3. Create Super Admin User
  const passwordHash = await bcrypt.hash('Password@123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { 
      tenantId_email: { tenantId: systemTenant.id, email: 'superadmin@peopleflow.com' } 
    },
    update: { passwordHash },
    create: {
      tenantId: systemTenant.id,
      email: 'superadmin@peopleflow.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      status: 'active',
      emailVerifiedAt: new Date()
    }
  });

  // 4. Assign Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id
      }
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      tenantId: systemTenant.id
    }
  });

  console.log('Seeding completed successfully!');
  console.log('Super Admin Credentials:');
  console.log('Email: superadmin@peopleflow.com');
  console.log('Password: Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
