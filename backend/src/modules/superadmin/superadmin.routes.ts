import { Router } from 'express';
import { SuperAdminController } from './superadmin.controller';
import { requireRoles } from '../../middleware/authorization.middleware';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';

const router = Router();
const controller = new SuperAdminController();

// Apply middleware to all routes in this module
router.use(authenticationMiddleware);
router.use(requireRoles(['super_admin']));

// Dashboard
// Dashboard & Metrics
router.get('/dashboard', controller.getDashboard);
router.get('/platform-usage', controller.getPlatformUsage);
router.get('/system-health', controller.getSystemHealth);
router.get('/recent-activity', controller.getRecentActivity);
router.get('/security-alerts', controller.getSecurityAlerts);

// Organizations
router.get('/organizations', controller.listOrganizations);
router.post('/organizations', controller.createOrganization);
router.get('/organizations/:id', controller.getOrganization);
router.patch('/organizations/:id/status', controller.updateOrgStatus);
router.delete('/organizations/:id', controller.deleteOrganization);

// Subscription Plans
router.get('/plans', controller.listPlans);
router.post('/plans', controller.createPlan);
router.patch('/plans/:id', controller.updatePlan);

// Integrations
// Integrations
router.get('/integrations', controller.listIntegrations);
router.post('/integrations', controller.addIntegration);

// System Jobs
router.get('/jobs', controller.listJobs);
router.post('/jobs/:jobId/retry', controller.retryJob);
router.post('/jobs/:jobId/cancel', controller.cancelJob);

// Support & Impersonation
router.get('/support/tickets', controller.listSupportTickets);
router.post('/support/tickets/:ticketId/assign', controller.assignTicket);
router.post('/support/impersonation/start', controller.startImpersonation);
router.post('/support/impersonation/:sessionId/end', controller.endImpersonation);

export { router as superAdminRoutes };
