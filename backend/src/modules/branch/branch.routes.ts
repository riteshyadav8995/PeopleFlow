import { Router } from 'express';
import { BranchController } from './branch.controller';
import { validate } from '../../middleware/validation.middleware';
import { createBranchSchema, updateBranchSchema } from './branch.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const branchController = new BranchController();

router.use(authenticationMiddleware, tenantMiddleware);

router.get('/', authorize('organization:read'), branchController.listBranches);
router.get('/:id', authorize('organization:read'), branchController.getBranch);
router.post('/', authorize('organization:write'), validate(createBranchSchema), branchController.createBranch);
router.put('/:id', authorize('organization:write'), validate(updateBranchSchema), branchController.updateBranch);
router.delete('/:id', authorize('organization:delete'), branchController.deleteBranch);

export default router;
