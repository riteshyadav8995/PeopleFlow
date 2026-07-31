import { Router } from 'express';
import { PayrollController } from './payroll.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { requireRoles } from '../../middleware/authorization.middleware';
import { SYSTEM_ROLES } from '../../core/constants/role.constant';
import { authorize } from '../../middleware/authorization.middleware';
import { createSalaryStructureSchema, generatePayrollSchema } from './payroll.validation';

const router = Router();
const payrollController = new PayrollController();

router.use(authenticationMiddleware);

// Admin-only routes
router.post(
  '/structures',
  authorize('payroll.run:create'),
  validate(createSalaryStructureSchema),
  payrollController.upsertSalaryStructure
);

// Maker-Checker
router.post(
  '/runs/generate',
  authorize('payroll.run:create'),
  payrollController.generatePayrollRun
);

router.post(
  '/runs/:runId/approve',
  authorize('payroll.run:approve'),
  payrollController.approvePayrollRun
);

router.post(
  '/runs/:runId/publish',
  authorize('payroll.run:approve'), // Assuming same permission level or create a new one
  payrollController.publishPayrollRun
);

// Admins can see all, employees can only see their own payslips
router.get('/payslips', authorize('payslip.record:read'), payrollController.getPayslips);
router.get('/structures/:employeeId', authorize('payslip.record:read'), payrollController.getSalaryStructure);

export default router;
