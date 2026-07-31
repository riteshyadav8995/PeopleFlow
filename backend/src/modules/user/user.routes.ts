import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '../../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from './user.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';
import { paginationMiddleware } from '../../middleware/pagination.middleware';

const router = Router();
const userController = new UserController();

// All user routes require authentication and tenant context
router.use(authenticationMiddleware, tenantMiddleware);

router.get(
  '/',
  authorize('user:read'),
  paginationMiddleware,
  userController.listUsers
);

router.get(
  '/:id',
  authorize('user:read'),
  userController.getUser
);

router.post(
  '/',
  authorize('user:write'),
  validate(createUserSchema),
  userController.createUser
);

router.put(
  '/:id',
  authorize('user:write'),
  validate(updateUserSchema),
  userController.updateUser
);

router.delete(
  '/:id',
  authorize('user:delete'),
  userController.deleteUser
);

export default router;
