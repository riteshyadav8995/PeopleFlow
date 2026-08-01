import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { loginSchema, registerSchema, refreshTokenSchema, activateSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { requireRoles } from '../../middleware/authorization.middleware';
import { SYSTEM_ROLES } from '../../core/constants/role.constant';

const router = Router();
const authController = new AuthController();

// Registration is now restricted to Super Admins only
router.post('/register', 
  authenticationMiddleware, 
  requireRoles([SYSTEM_ROLES.SUPER_ADMIN]), 
  validate(registerSchema), 
  authController.register
);

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/activate', validate(activateSchema), authController.activateAccount);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/switch-workspace', authenticationMiddleware, authController.switchWorkspace);
router.post('/logout-all', authenticationMiddleware, authController.logoutAll);

export default router;
