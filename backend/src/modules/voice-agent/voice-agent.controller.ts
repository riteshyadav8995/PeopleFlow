import { Request, Response, NextFunction } from 'express';
import { VoiceAgentService } from './voice-agent.service';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { prisma } from '../../core/base/base.model';

export class VoiceAgentController extends BaseController {
  private voiceService = new VoiceAgentService();

  // Twilio Webhook to provide TwiML for WebSocket streaming
  twilioWebhook = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const callLogId = req.query.callLogId as string;
    // Generate absolute WebSocket URL based on the incoming request host
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
    const host = req.headers.host;
    const streamUrl = `${wsProtocol}://${host}/api/v1/voice-agent/twilio-stream${callLogId ? `?callLogId=${callLogId}` : ''}`;
    
    let greeting = "Please hold while I connect you to the AI assistant.";
    
    if (callLogId) {
      try {
        const callLog = await prisma.voiceCallLog.findUnique({
          where: { id: callLogId },
          include: { campaign: { include: { configurations: true } } }
        });
        const campaignPrompt = callLog?.campaign?.configurations?.[0]?.systemPrompt;
        if (campaignPrompt) {
          greeting = campaignPrompt;
        }
      } catch (err) {
        console.error('[Twilio Webhook] Error fetching campaign prompt', err);
      }
    }

    console.log(`[Twilio Webhook] Hit! callLogId=${callLogId}, host=${host}, streamUrl=${streamUrl}`);
    
    // Return TwiML: brief greeting then connect to WebSocket stream for AI conversation
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi">${greeting}</Say>
        <Connect>
          <Stream url="${streamUrl}" />
        </Connect>
      </Response>`;

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  });

  getCampaigns = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const campaigns = await this.voiceService.getCampaigns(context);
    res.json({ data: campaigns });
  });

  createCampaign = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const campaign = await this.voiceService.createCampaign(context, req.body);
    res.status(201).json({ data: campaign, message: 'Voice campaign created successfully' });
  });

  updateCampaign = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const campaign = await this.voiceService.updateCampaign(context, req.params.id as string, req.body);
    res.json({ data: campaign, message: 'Voice campaign updated successfully' });
  });

  deleteCampaign = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    await this.voiceService.deleteCampaign(context, req.params.id as string);
    res.json({ message: 'Voice campaign deleted successfully' });
  });

  startCall = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const callLog = await this.voiceService.startCall(context, req.body);
    res.status(201).json({ data: callLog, message: 'Call started' });
  });

  generateAIResponse = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const { message } = req.body;
    const response = await this.voiceService.generateAIResponse(context, req.params.id as string, message);
    res.json({ data: response });
  });

  getCallLogs = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const logs = await this.voiceService.getCallLogs(context, req.query.campaignId as string);
    res.json({ data: logs });
  });

  getCallTranscript = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const log = await this.voiceService.getCallTranscript(context, req.params.id as string);
    res.json({ data: log });
  });

  // --- Public Browser Calling Methods ---

  getPublicCallInfo = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const log = await this.voiceService.getPublicCallInfo(req.params.id as string);
    res.json({ data: log });
  });

  publicInteract = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { message } = req.body;
    const response = await this.voiceService.publicInteract(req.params.id as string, message);
    res.json({ data: response });
  });

  endCallPublic = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const log = await this.voiceService.endCallPublic(req.params.id as string);
    res.json({ data: log, message: 'Call ended and summarized successfully' });
  });
}
