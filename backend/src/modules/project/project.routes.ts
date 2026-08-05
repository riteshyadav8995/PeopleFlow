import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const controller = new ProjectController();

// All project routes require auth and tenant
router.use(authenticationMiddleware, tenantMiddleware);

router.post(
  '/',
  authorize('project.record.create'),
  controller.createProject
);

router.get(
  '/',
  authorize('project.record.read'),
  controller.getProjects
);

router.get(
  '/:id',
  authorize('project.record.read'),
  controller.getProjectDetails
);

router.post(
  '/:id/status',
  authorize('project.record.update'),
  controller.updateProjectStatus
);

router.post(
  '/:id/members',
  authorize(), // Let service handle specific authorization (like project manager check)
  controller.addProjectMember
);

router.put(
  '/:id',
  authorize('project.record.update'),
  controller.updateProject
);

router.delete(
  '/:id',
  authorize('project.record.delete'),
  controller.deleteProject
);

export default router;
