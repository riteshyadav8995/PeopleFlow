import { Router } from 'express';
import { TenantController } from './tenant.controller';
import { validate } from '../../middleware/validation.middleware';
import { updateTenantSchema } from './tenant.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const tenantController = new TenantController();

// All tenant routes require authentication and tenant context
router.use(authenticationMiddleware, tenantMiddleware);

// Get current tenant settings
router.get(
  '/',
  authorize('tenant:read'),
  tenantController.getTenant
);

// Update current tenant settings
router.put(
  '/',
  authorize('tenant:update'),
  validate(updateTenantSchema),
  tenantController.updateTenant
);

export default router;
