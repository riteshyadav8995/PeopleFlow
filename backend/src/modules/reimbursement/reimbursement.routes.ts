import { Router } from 'express';
import { ReimbursementController } from './reimbursement.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const controller = new ReimbursementController();

router.use(authenticationMiddleware, tenantMiddleware);

// Employee routes
router.post('/', controller.submitClaim);
router.get('/my-claims', controller.getMyClaims);

// Admin / Manager routes
router.get('/team-claims', controller.getTeamClaims);
router.get('/', authorize('payroll.run:approve'), controller.getAllClaims);
router.patch('/:id/status', authorize('payroll.run:approve'), controller.updateClaimStatus);

export default router;
