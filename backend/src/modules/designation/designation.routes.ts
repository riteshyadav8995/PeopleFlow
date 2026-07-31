import { Router } from 'express';
import { DesignationController } from './designation.controller';
import { validate } from '../../middleware/validation.middleware';
import { createDesignationSchema, updateDesignationSchema } from './designation.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const designationController = new DesignationController();

router.use(authenticationMiddleware, tenantMiddleware);

router.get('/', authorize('organization:read'), designationController.listDesignations);
router.get('/:id', authorize('organization:read'), designationController.getDesignation);
router.post('/', authorize('organization:write'), validate(createDesignationSchema), designationController.createDesignation);
router.put('/:id', authorize('organization:write'), validate(updateDesignationSchema), designationController.updateDesignation);
router.delete('/:id', authorize('organization:delete'), designationController.deleteDesignation);

export default router;
