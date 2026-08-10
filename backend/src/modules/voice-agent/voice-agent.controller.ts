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
    const host = req.headers.host;
    const streamUrl = `wss://${host}/api/v1/voice-agent/twilio-stream?callLogId=${callLogId || ''}`;

    // Escape XML special characters so Twilio doesn't crash
    const escapeXml = (unsafe: string) => {
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
    };

    let greeting = 'Hello, this is the PeopleFlow AI Assistant calling.';

    // Fetch campaign prompt, candidate info, and generate LLM response
    if (callLogId) {
      try {
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

        // Append candidate and job context
        if (callLog?.candidate) {
          const c = callLog.candidate;
          systemPrompt += `\n\n### CANDIDATE INFORMATION ###\nName: ${c.firstName} ${c.lastName}\nEmail: ${c.email}\nPhone: ${c.phone || 'N/A'}\nTotal Experience: ${c.totalExperience || 0} years\nCurrent Company: ${c.currentCompany || 'N/A'}\nExpected Salary: ${c.expectedSalary || 'N/A'}`;
        }
        if (callLog?.jobOpening) {
          const j = callLog.jobOpening;
          systemPrompt += `\n\n### JOB OPENING DETAILS ###\nTitle: ${j.title}\nEmployment Type: ${j.employmentType}\nWork Mode: ${j.workMode}\nRequired Experience: ${j.experienceMin || 0} - ${j.experienceMax || 'Any'} years\nDescription: ${j.publicDescription || 'N/A'}`;
        }

        // Generate LLM response using Gemini
        const llmApiKey = process.env.GEMINI_API_KEY || '';
        if (llmApiKey) {
          console.log(`[Twilio Webhook] Generating LLM greeting from campaign prompt...`);
          const genAI = new GoogleGenerativeAI(llmApiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const chat = model.startChat({
            history: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              { role: 'model', parts: [{ text: 'Understood. I am ready.' }] }
            ]
          });

          // Race against an 8-second timeout so Twilio doesn't hang up
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini timeout (8s)')), 8000)
          );
          const geminiPromise = chat.sendMessage(
            'You are initiating the call now. Greet the candidate, introduce yourself, and begin the conversation following your system instructions. Keep it concise (2-3 sentences max).'
          );

          try {
            const result: any = await Promise.race([geminiPromise, timeoutPromise]);
            greeting = result.response.text().trim();
            console.log(`[Twilio Webhook] LLM Greeting: ${greeting}`);
          } catch (err) {
            console.error('[Twilio Webhook] Gemini failed/timed out, using default greeting', err);
          }
        }
      } catch (error) {
        console.error('[Twilio Webhook] Error fetching call log:', error);
      }
    }

    // Return TwiML: Say the LLM greeting, then open the WebSocket stream for two-way conversation
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi">${escapeXml(greeting)}</Say>
        <Connect>
          <Stream url="${streamUrl}" />
        </Connect>
      </Response>`;

    console.log(`[Twilio Webhook] Returning TwiML with stream URL: ${streamUrl}`);
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
