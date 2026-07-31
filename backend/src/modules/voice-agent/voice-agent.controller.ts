import { Request, Response, NextFunction } from 'express';
import { VoiceAgentService } from './voice-agent.service';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class VoiceAgentController extends BaseController {
  private voiceService = new VoiceAgentService();

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
    res.status(201).json({ data: campaign, message: 'Campaign created successfully' });
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
}
