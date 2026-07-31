import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { validate } from '../../middleware/validation.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const employeeController = new EmployeeController();

router.use(authenticationMiddleware, tenantMiddleware);

router.get('/', authorize('employee.record:read'), employeeController.listEmployees);
router.get('/reports/team-metrics', authorize('employee.record:read'), employeeController.getTeamMetrics);
router.get('/:id', authorize('employee.record:read'), employeeController.getEmployee);
router.post('/', authorize('employee.record:create'), validate(createEmployeeSchema), employeeController.createEmployee);
router.put('/:id', authorize('employee.record:update'), validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', authorize('employee.record:deactivate'), employeeController.deleteEmployee);

export default router;
