import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../../core/base/base.model';

const CORE_PERMISSIONS = [
  // Employees
  { resource: 'employee.record', action: 'create' },
  { resource: 'employee.record', action: 'read' },
  { resource: 'employee.record', action: 'update' },
  { resource: 'employee.record', action: 'deactivate' },
  // Attendance
  { resource: 'attendance.record', action: 'read' },
  { resource: 'attendance.correction', action: 'create' },
  { resource: 'attendance.correction', action: 'approve' },
  { resource: 'attendance.period', action: 'lock' },
  { resource: 'attendance.period', action: 'unlock' },
  // Leave
  { resource: 'leave.request', action: 'create' },
  { resource: 'leave.request', action: 'read' },
  { resource: 'leave.request', action: 'approve' },
  { resource: 'leave.request', action: 'reject' },
  { resource: 'leave.balance', action: 'adjust' },
  // Projects
  { resource: 'project.record', action: 'create' },
  { resource: 'project.member', action: 'assign' },
  { resource: 'project.record', action: 'update' },
  { resource: 'project.record', action: 'close' },
  // Tasks
  { resource: 'task.record', action: 'create' },
  { resource: 'task.record', action: 'assign' },
  { resource: 'task.record', action: 'update' },
  { resource: 'task.record', action: 'complete' },
  // Timesheets
  { resource: 'timesheet.entry', action: 'create' },
  { resource: 'timesheet.submission', action: 'submit' },
  { resource: 'timesheet.submission', action: 'approve' },
  { resource: 'timesheet.submission', action: 'lock' },
  // Payroll
  { resource: 'payroll.run', action: 'create' },
  { resource: 'payroll.run', action: 'calculate' },
  { resource: 'payroll.run', action: 'review' },
  { resource: 'payroll.run', action: 'approve' },
  { resource: 'payroll.run', action: 'lock' },
  { resource: 'payroll.run', action: 'reverse' },
  // Payslips
  { resource: 'payslip.record', action: 'generate' },
  { resource: 'payslip.record', action: 'publish' },
  { resource: 'payslip.record', action: 'read' }
];

const ROLE_PERMISSIONS = {
  'tenant_admin': CORE_PERMISSIONS, // Tenant Admin gets all core permissions
  'manager': [
    { resource: 'employee.record', action: 'read' },
    { resource: 'attendance.record', action: 'read' },
    { resource: 'attendance.correction', action: 'approve' },
    { resource: 'leave.request', action: 'read' },
    { resource: 'leave.request', action: 'approve' },
    { resource: 'leave.request', action: 'reject' },
    { resource: 'project.record', action: 'read' },
    { resource: 'task.record', action: 'create' },
    { resource: 'task.record', action: 'assign' },
    { resource: 'task.record', action: 'update' },
    { resource: 'task.record', action: 'complete' },
    { resource: 'timesheet.submission', action: 'approve' },
    { resource: 'payslip.record', action: 'read' },
    // Managers can also do employee actions
    { resource: 'leave.request', action: 'create' },
    { resource: 'attendance.correction', action: 'create' },
    { resource: 'timesheet.entry', action: 'create' },
    { resource: 'timesheet.submission', action: 'submit' },
  ],
  'employee': [
    { resource: 'employee.record', action: 'read' },
    { resource: 'attendance.record', action: 'read' },
    { resource: 'attendance.correction', action: 'create' },
    { resource: 'leave.request', action: 'create' },
    { resource: 'leave.request', action: 'read' },
    { resource: 'task.record', action: 'read' },
    { resource: 'task.record', action: 'update' },
    { resource: 'task.record', action: 'complete' },
    { resource: 'timesheet.entry', action: 'create' },
    { resource: 'timesheet.submission', action: 'submit' },
    { resource: 'payslip.record', action: 'read' },
  ]
};

async function main() {
  console.log('Seeding granular permissions...');

  // 1. Create permissions
  for (const perm of CORE_PERMISSIONS) {
    await prisma.permission.upsert({
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
        description: `Allows ${perm.action} on ${perm.resource}`
      }
    });
  }

  // Fetch all created permissions to map IDs
  const allPerms = await prisma.permission.findMany();
  const permMap = new Map();
  allPerms.forEach(p => permMap.set(`${p.resource}:${p.action}`, p.id));

  // 2. We need to assign these to roles across tenants.
  // For safety, we find standard roles (tenant_admin, manager, employee) across all tenants
  const roles = await prisma.role.findMany({
    where: {
      slug: { in: ['tenant_admin', 'manager', 'employee'] }
    }
  });

  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role.slug as keyof typeof ROLE_PERMISSIONS];
    if (!rolePerms) continue;

    for (const p of rolePerms) {
      const permId = permMap.get(`${p.resource}:${p.action}`);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId
          }
        });
      }
    }
  }

  console.log('Permission seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
