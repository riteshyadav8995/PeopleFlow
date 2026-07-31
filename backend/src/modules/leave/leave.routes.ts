import { Router } from 'express';
import { LeaveController } from './leave.controller';
import { validate } from '../../middleware/validation.middleware';
import { createLeaveRequestSchema, approveLeaveRequestSchema, createLeavePolicySchema } from './leave.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const leaveController = new LeaveController();

// Temporary seed route (no auth required)
router.get('/seed', async (req, res) => {
  try {
    const { prisma } = require('../../core/base/base.model');
    const tenant = await prisma.tenant.findFirst();
    const org = await prisma.organization.findFirst();
    const employee = await prisma.employee.findFirst({ where: { email: 'rky594237@gmail.com' } });
    if (!tenant || !org || !employee) return res.status(500).json({ error: 'Missing tenant, org or employee' });

    const leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Marriage Leave'];
    for (const typeName of leaveTypes) {
      let leaveType = await prisma.leaveType.findFirst({ where: { organizationId: org.id, name: typeName } });
      if (!leaveType) {
        leaveType = await prisma.leaveType.create({
          data: {
            tenantId: tenant.id,
            organizationId: org.id,
            name: typeName,
            description: typeName,
            daysPerYear: 10,
            isActive: true,
            code: typeName.split(' ').map(w => w[0]).join('').toUpperCase()
          }
        })
      }
      const balance = await prisma.leaveBalance.findFirst({
        where: { employeeId: employee.id, leaveTypeId: leaveType.id, year: new Date().getFullYear() }
      });
      if (!balance) {
        await prisma.leaveBalance.create({
          data: {
            tenantId: tenant.id,
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: new Date().getFullYear(),
            totalDays: 10,
            usedDays: 0,
            pendingDays: 0
          }
        });
      }
    }
    res.json({ message: 'Leave seeded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to seed leaves' });
  }
});

// Accrual Engine route
router.post('/accrue', authorize('leave.policy:manage'), leaveController.accrueLeaves);

router.use(authenticationMiddleware, tenantMiddleware);

router.get('/types', authorize('leave.request:read'), leaveController.getTypes);
router.get('/balances', authorize('leave.request:read'), leaveController.getMyBalances);
router.post('/request', authorize('leave.request:create'), validate(createLeaveRequestSchema), leaveController.requestLeave);
router.get('/my-requests', authorize('leave.request:read'), leaveController.getMyRequests);

// Manager specific routes
router.get('/pending-approvals', authorize('leave.request:read'), leaveController.getPendingApprovals);
router.get('/team-requests', authorize('leave.request:read'), leaveController.getTeamRequests);
router.put('/review/:id', authorize('leave.request:approve'), validate(approveLeaveRequestSchema), leaveController.reviewLeave);

// Organization Admin Routes
router.get('/dashboard', authorize('leave.manage:read'), leaveController.getOrgDashboardStats);
router.get('/requests/all', authorize('leave.manage:read'), leaveController.getOrgLeaveRequests);
router.get('/calendar', authorize('leave.manage:read'), leaveController.getOrgLeaveCalendar);

// Analytics Routes
router.get('/analytics/trend', authorize('leave.manage:read'), leaveController.getMonthlyLeaveTrend);
router.get('/analytics/department-distribution', authorize('leave.manage:read'), leaveController.getDepartmentLeaveDistribution);
router.get('/analytics/department-summary', authorize('leave.manage:read'), leaveController.getDepartmentSummary);
router.get('/policies', authorize('leave.manage:read'), leaveController.getLeavePolicies);
router.post('/policies', authorize('leave.manage:write'), validate(createLeavePolicySchema), leaveController.createLeavePolicy);
router.get('/events', authorize('leave.manage:read'), leaveController.getUpcomingEvents);
router.get('/exceptions', authorize('leave.manage:read'), leaveController.getLeaveBalanceExceptions);

export default router;
