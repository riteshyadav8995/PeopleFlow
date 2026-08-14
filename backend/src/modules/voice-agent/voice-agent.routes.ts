import { Router } from 'express';
import { VoiceAgentController } from './voice-agent.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const controller = new VoiceAgentController();

// --- Public Webhooks (Veytrix hits these, no auth required) ---
router.post('/veytrix/webhook', controller.veytrixWebhook);

// --- Public Browser Call Endpoints ---
router.get('/public/calls/:id', controller.getPublicCallInfo);
router.post('/public/calls/:id/interact', controller.publicInteract);
router.post('/public/calls/:id/end', controller.endCallPublic);

router.get('/debug', controller.debugKeys);

router.use(authenticationMiddleware, tenantMiddleware);

// Campaigns
router.get('/campaigns', authorize('voice.campaign.read'), controller.getCampaigns);
router.post('/campaigns', authorize('voice.campaign.create'), controller.createCampaign);
router.put('/campaigns/:id', authorize('voice.campaign.update'), controller.updateCampaign);
router.delete('/campaigns/:id', authorize('voice.campaign.delete'), controller.deleteCampaign);

// Calls
router.get('/calls', authorize('voice.call.read'), controller.getCallLogs);
router.post('/calls', authorize('voice.call.create'), controller.startCall);
router.post('/calls/bulk', authorize('voice.call.create'), controller.startBulkCalls);
router.get('/calls/:id', authorize('voice.call.read'), controller.getCallTranscript);
router.post('/calls/:id/interact', authorize('voice.call.create'), controller.generateAIResponse);

export default router;
