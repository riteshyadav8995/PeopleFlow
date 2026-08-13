import { Request, Response, NextFunction } from 'express';
import { VoiceAgentService } from './voice-agent.service';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';
import { prisma } from '../../core/base/base.model';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class VoiceAgentController extends BaseController {
  private voiceService = new VoiceAgentService();

  // Escape XML special characters so Twilio doesn't crash on < or &
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Build the system prompt from campaign, candidate, and job data
  private async buildSystemPrompt(callLogId: string): Promise<string> {
    const callLog = await prisma.voiceCallLog.findUnique({
      where: { id: callLogId },
      include: {
        campaign: { include: { configurations: true } },
        candidate: true,
        jobOpening: true
      }
    });

    let systemPrompt = callLog?.campaign?.configurations?.[0]?.systemPrompt || '';
    if (!systemPrompt || systemPrompt.trim() === '') {
      systemPrompt = 'You are a helpful HR Assistant for PeopleFlow calling a candidate about a job application.';
    }

    if (callLog?.campaign) {
      systemPrompt += `\n\n### CAMPAIGN DETAILS ###\nName: ${callLog.campaign.name}\nDescription: ${callLog.campaign.description || 'N/A'}\nType: ${callLog.campaign.type}`;
    }

    if (callLog?.candidate) {
      const c = callLog.candidate;
      systemPrompt += `\n\n### CANDIDATE INFORMATION ###\nName: ${c.firstName} ${c.lastName}\nEmail: ${c.email}\nPhone: ${c.phone || 'N/A'}\nTotal Experience: ${c.totalExperience || 0} years\nCurrent Company: ${c.currentCompany || 'N/A'}\nExpected Salary: ${c.expectedSalary || 'N/A'}`;
    }
    if (callLog?.jobOpening) {
      const j = callLog.jobOpening;
      systemPrompt += `\n\n### JOB OPENING DETAILS ###\nTitle: ${j.title}\nEmployment Type: ${j.employmentType}\nWork Mode: ${j.workMode}\nRequired Experience: ${j.experienceMin || 0} - ${j.experienceMax || 'Any'} years\nDescription: ${j.publicDescription || 'N/A'}`;
    }

    return systemPrompt;
  }

  // Generate a response from Gemini given a system prompt and conversation history
  private async askGemini(systemPrompt: string, conversationHistory: { role: string, parts: { text: string }[] }[], userMessage: string): Promise<string> {
    const llmApiKey = process.env.GEMINI_API_KEY || '';
    if (!llmApiKey) return 'I apologize, but I am unable to process your request at this time. Goodbye.';

    const genAI = new GoogleGenerativeAI(llmApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am ready to follow these instructions.' }] },
        ...conversationHistory
      ]
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout (10s)')), 10000)
    );
    const geminiPromise = chat.sendMessage(userMessage);
    const result: any = await Promise.race([geminiPromise, timeoutPromise]);
    return result.response.text().trim();
  }

  // --- Veytrix Webhook Handlers ---
  
  veytrixWebhook = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const callLogId = req.query.callLogId as string;
    const status = req.body.CallStatus || req.body.status;
    const duration = req.body.CallDuration || req.body.duration;

    if (!callLogId) {
      res.status(200).send();
      return;
    }

    console.log(`[Veytrix Status] Call ${callLogId} status: ${status}, duration: ${duration}`);

    try {
      let mappedStatus = 'IN_PROGRESS';
      if (status === 'completed' || status === 'completed_successfully') {
        mappedStatus = 'COMPLETED';
      } else if (status === 'no-answer' || status === 'busy' || status === 'failed' || status === 'canceled') {
        mappedStatus = 'FAILED';
      } else if (status === 'in-progress' || status === 'answered') {
        mappedStatus = 'ANSWERED';
      }

      await prisma.voiceCallLog.update({
        where: { id: callLogId },
        data: {
          status: mappedStatus,
          duration: duration ? parseInt(duration, 10) : undefined
        }
      });
      
    } catch (err) {
      console.error('[Veytrix Status] Failed to update call log status', err);
    }

    res.status(200).send();
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
