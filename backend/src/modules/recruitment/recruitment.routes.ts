import { Router } from 'express';
import { RecruitmentController } from './recruitment.controller';
import { authorize } from '../../middleware/authorization.middleware';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();
const controller = new RecruitmentController();

// Public routes (for Career Page)
router.get('/jobs/public', controller.getPublicJobs);
router.post('/jobs/:jobId/apply', controller.applyForJob);

// Apply authentication for the routes below
router.use(authenticationMiddleware, tenantMiddleware);

// Requisitions
router.post('/requisitions', authorize('recruitment.job.create'), controller.createRequisition);
router.get('/requisitions', authorize('recruitment.job.read'), controller.getRequisitions);
router.patch('/requisitions/:id/status', authorize('recruitment.job.approve'), controller.updateRequisitionStatus);

// Jobs (Internal)
router.post('/jobs', authorize('recruitment.job.create'), controller.createJob);
router.get('/jobs', authorize('recruitment.job.read'), controller.getJobs);
router.patch('/jobs/:id', authorize('recruitment.job.update'), controller.updateJob);
router.delete('/jobs/:id', authorize('recruitment.job.delete'), controller.deleteJob);

// Applications
router.get('/applications', authorize('recruitment.application.read'), controller.getApplications);
router.patch('/applications/:id/stage', authorize('recruitment.application.update_stage'), controller.updateApplicationStage);

// Interviews
router.post('/interviews', authorize('recruitment.interview.schedule'), controller.scheduleInterview);
router.get('/interviews', authorize('recruitment.interview.read', 'recruitment.feedback.submit'), controller.getInterviews);
router.post('/interviews/:id/feedback', authorize('recruitment.feedback.submit'), controller.submitInterviewFeedback);

export const recruitmentRoutes = router;
