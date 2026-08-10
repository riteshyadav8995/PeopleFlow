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

    let greeting = "Connecting you to the PeopleFlow AI Agent. Please hold. ";

    // Fetch Campaign, Candidate, and Job info directly in the webhook
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

        // Safety check: if systemPrompt is completely empty, provide a default so Gemini doesn't crash
        if (!systemPrompt || systemPrompt.trim() === '') {
          systemPrompt = "You are a helpful HR Assistant for PeopleFlow calling a candidate about a job application.";
        }

        if (callLog?.candidate) {
          const c = callLog.candidate;
          systemPrompt += `\n\n### CANDIDATE INFORMATION ###\nName: ${c.firstName} ${c.lastName}\nEmail: ${c.email}\nPhone: ${c.phone || 'N/A'}\nTotal Experience: ${c.totalExperience || 0} years\nCurrent Company: ${c.currentCompany || 'N/A'}\nExpected Salary: ${c.expectedSalary || 'N/A'}`;
        }
        if (callLog?.jobOpening) {
          const j = callLog.jobOpening;
          systemPrompt += `\n\n### JOB OPENING DETAILS ###\nTitle: ${j.title}\nEmployment Type: ${j.employmentType}\nWork Mode: ${j.workMode}\nRequired Experience: ${j.experienceMin || 0} - ${j.experienceMax || 'Any'} years\nDescription: ${j.publicDescription || 'N/A'}`;
        }

        // Helper function to escape XML characters so Twilio doesn't crash on < or &
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

        const llmApiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
        if (llmApiKey && systemPrompt) {
          console.log(`[Twilio Webhook] Asking Gemini to generate broadcast message...`);
          try {
            const genAI = new GoogleGenerativeAI(llmApiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const chatSession = model.startChat({
              history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Got it. I will deliver the message based on the context provided.' }] }
              ]
            });

            // Promise.race to enforce an 8-second timeout so Twilio doesn't hang up the call
            const timeoutPromise = new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error("Gemini API timeout (8s)")), 8000)
            );

            const geminiPromise = chatSession.sendMessage("Generate the one-way broadcast message based on the system prompt and candidate details. Do not ask questions, just deliver the message.");

            const result: any = await Promise.race([geminiPromise, timeoutPromise]);
            const aiMessage = result.response.text().trim();
            greeting += escapeXml(aiMessage);
            console.log(`[Twilio Webhook] Generated combined greeting: ${greeting}`);
          } catch (geminiError) {
            console.error('[Twilio Webhook] Gemini failed or timed out. Falling back to raw system prompt.', geminiError);
            greeting += escapeXml(systemPrompt); // Fallback if LLM fails
          }
        } else {
          // If no API key, just use the raw system prompt
          greeting += escapeXml(systemPrompt);
        }
      } catch (error) {
        console.error('[Twilio Webhook] Error fetching call log:', error);
      }
    }

    // Return TwiML: Twilio will read the entire message and then automatically hang up
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi">${greeting}</Say>
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
