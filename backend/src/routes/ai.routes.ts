import { Router } from 'express';
import { handleChat, handleVoice } from '../controllers/ai.controller';
import { authenticationMiddleware } from '../middleware/authentication.middleware';

const router = Router();

// Apply auth middleware so only logged-in users can use AI
router.use(authenticationMiddleware);

router.post('/chat', handleChat);
router.post('/voice', handleVoice);

export default router;
