import { Request, Response, NextFunction } from 'express';
import { VoiceAgentService } from './voice-agent.service';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { prisma } from '../../core/base/base.model';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class VoiceAgentController extends BaseController {
  private voiceService = new VoiceAgentService();

  // Twilio Webhook to provide TwiML for WebSocket streaming
  twilioWebhook = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const callLogId = req.query.callLogId as string;
    
    // Get the base URL (e.g. from ngrok, render, etc)
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    
    // Twilio Media Streams require a wss:// URL
    const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
    const streamUrl = `${wsProtocol}://${host}/api/v1/voice-agent/twilio-stream?callLogId=${callLogId || ''}`;

    // We use <Connect><Stream> to open the WebSocket to our server
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi">Please hold while I connect you to the PeopleFlow AI.</Say>
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

  debugKeys = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    res.json({
      deepgram: !!(process.env.DEEPGRAM_API_KEY),
      gemini: !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
      env_keys: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('TOKEN'))
    });
  });
}
