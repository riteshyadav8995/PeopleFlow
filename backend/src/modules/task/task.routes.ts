import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const controller = new TaskController();

// All task routes require auth and tenant
router.use(authenticationMiddleware, tenantMiddleware);

router.post(
  '/',
  authorize('task.record.create'),
  controller.createTask
);

router.get(
  '/',
  authorize('task.record.read'),
  controller.getTasks
);

router.put(
  '/:id',
  authorize('task.record.update'),
  controller.updateTask
);

router.post(
  '/:id/status',
  authorize('task.record.update'),
  controller.updateTaskStatus
);

router.post(
  '/:id/comments',
  authorize('task.comment.create'),
  controller.addComment
);

export default router;
