import { Router } from 'express';
import { VoiceAgentController } from './voice-agent.controller';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const controller = new VoiceAgentController();

// --- Public Webhooks ---
// Exotel hits this to get the TwiML/SVAML to connect to our WebSocket
router.post('/exotel/webhook', controller.exotelWebhook);

router.use(authenticationMiddleware, tenantMiddleware);

// Campaigns
router.get('/campaigns', authorize('voice.campaign.read'), controller.getCampaigns);
router.post('/campaigns', authorize('voice.campaign.create'), controller.createCampaign);

// Calls
router.get('/calls', authorize('voice.call.read'), controller.getCallLogs);
router.post('/calls', authorize('voice.call.create'), controller.startCall);
router.get('/calls/:id', authorize('voice.call.read'), controller.getCallTranscript);
router.post('/calls/:id/interact', authorize('voice.call.create'), controller.generateAIResponse);

export default router;
