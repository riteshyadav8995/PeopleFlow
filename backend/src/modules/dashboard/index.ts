import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';

const router = Router();

router.use(authenticationMiddleware);

router.get('/employee', dashboardController.getEmployeeDashboard);
router.get('/calendar', dashboardController.getCalendarEvents);
router.patch('/notifications/:id/read', dashboardController.markNotificationRead);
router.post('/seed', dashboardController.seedData);
router.get('/manager/productivity', dashboardController.getManagerProductivity);

export { router as dashboardRoutes };
