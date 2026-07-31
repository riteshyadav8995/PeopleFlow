import { Router } from 'express';
import { PerformanceController } from './performance.controller';
import { authorize } from '../../middleware/authorization.middleware';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();
const controller = new PerformanceController();

router.use(authenticationMiddleware, tenantMiddleware);

// Goals
router.get('/goals', controller.getTeamGoals);
router.post('/goals', controller.createGoal);
router.delete('/goals/:id', controller.deleteGoal);

// Feedback
router.get('/feedback', controller.getTeamFeedback);
router.post('/feedback', controller.createFeedback);
router.delete('/feedback/:id', controller.deleteFeedback);

// Meetings
router.get('/meetings', controller.getTeamMeetings);
router.post('/meetings', controller.createMeeting);
router.patch('/meetings/:id/complete', controller.completeMeeting);

export default router;
