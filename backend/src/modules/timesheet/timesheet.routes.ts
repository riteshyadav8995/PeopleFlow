import { Router } from 'express';
import { TimesheetController } from './timesheet.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const controller = new TimesheetController();

// All timesheet routes require auth and tenant
router.use(authenticationMiddleware, tenantMiddleware);

router.post(
  '/',
  authorize('timesheet.submission.submit'),
  controller.submitTimesheet
);

router.get(
  '/',
  authorize('timesheet.submission.read'),
  controller.getTimesheets
);

router.post(
  '/:id/approve',
  authorize('timesheet.submission.approve'),
  controller.approveTimesheet
);

router.post(
  '/log',
  authorize('time.entry.create'),
  controller.logTime
);

export default router;
