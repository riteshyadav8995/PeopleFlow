import { Router } from 'express';
import { OnboardingController } from './onboarding.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const controller = new OnboardingController();

// Apply auth + tenant middleware to all onboarding routes
router.use(authenticationMiddleware, tenantMiddleware);

// Templates
router.post('/templates', authorize('onboarding.template.create'), controller.createTemplate);
router.get('/templates', authorize('onboarding.template.read'), controller.getTemplates);
router.patch('/templates/:id', authorize('onboarding.template.update'), controller.updateTemplate);
router.delete('/templates/:id', authorize('onboarding.template.delete'), controller.deleteTemplate);

// Workflows
router.post('/workflows', authorize('onboarding.workflow.assign'), controller.assignWorkflow);
router.get('/workflows', authorize('onboarding.workflow.read'), controller.getWorkflows);
router.delete('/workflows/:id', authorize('onboarding.workflow.delete'), controller.deleteWorkflow);

// Tasks
router.get('/tasks/me', authorize('onboarding.task.read'), controller.getMyTasks);
router.patch('/tasks/:id/complete', authorize('onboarding.task.update'), controller.completeTask);

export const onboardingRoutes = router;
