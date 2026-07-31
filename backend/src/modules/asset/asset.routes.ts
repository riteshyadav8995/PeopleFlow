import { Router } from 'express';
import { AssetController } from './asset.controller';
import { authorize } from '../../middleware/authorization.middleware';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();
const controller = new AssetController();

router.use(authenticationMiddleware, tenantMiddleware);

router.get('/team-requests', controller.getTeamAssetRequests);
router.patch('/requests/:id/status', controller.updateAssetRequestStatus);

export default router;
