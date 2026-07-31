import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { validate } from '../../middleware/validation.middleware';
import { createDepartmentSchema, updateDepartmentSchema } from './department.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const departmentController = new DepartmentController();

router.use(authenticationMiddleware, tenantMiddleware);

router.get('/', authorize('organization:read'), departmentController.listDepartments);
router.get('/:id', authorize('organization:read'), departmentController.getDepartment);
router.post('/', authorize('organization:write'), validate(createDepartmentSchema), departmentController.createDepartment);
router.put('/:id', authorize('organization:write'), validate(updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', authorize('organization:delete'), departmentController.deleteDepartment);

export default router;
