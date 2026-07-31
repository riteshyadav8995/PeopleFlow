import { Router } from 'express';
import { OrganizationAdminController } from './organization-admin.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { requireRoles } from '../../middleware/authorization.middleware';
import { SYSTEM_ROLES } from '../../core/constants/role.constant';

const router = Router();
const controller = new OrganizationAdminController();

// Only organization admins and above should access these
router.use(authenticationMiddleware);
router.use(requireRoles([SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.TENANT_ADMIN, SYSTEM_ROLES.HR_MANAGER]));

router.get('/dashboard', controller.getDashboardStats);
router.get('/approvals', controller.getPendingApprovals);
router.post('/report', controller.generateReport);
router.get('/activity', controller.getRecentActivity);

export { router as organizationAdminRoutes };
