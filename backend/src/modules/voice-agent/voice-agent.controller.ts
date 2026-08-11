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
  private async askGemini(systemPrompt: string, conversationHistory: {role: string, parts: {text: string}[]}[], userMessage: string): Promise<string> {
    const llmApiKey = process.env.GEMINI_API_KEY || '';
    if (!llmApiKey) return 'I apologize, but I am unable to process your request at this time. Goodbye.';

    const genAI = new GoogleGenerativeAI(llmApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

  // 1) INITIAL WEBHOOK: Twilio calls this when the candidate picks up.
  //    We generate the AI's opening greeting and wrap it in <Say> + <Gather>.
  twilioWebhook = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const callLogId = req.query.callLogId as string;
    const backendUrl = process.env.BACKEND_URL || `https://${req.headers.host}`;
    const gatherUrl = `${backendUrl}/api/v1/voice-agent/twilio/gather?callLogId=${callLogId || ''}`;

    let greeting = 'Hello, this is the PeopleFlow AI Assistant calling. How are you doing today?';

    if (callLogId) {
      try {
        const systemPrompt = await this.buildSystemPrompt(callLogId);
        const aiGreeting = await this.askGemini(
          systemPrompt,
          [],
          'You are initiating the call now. Greet the candidate by name, introduce yourself, and briefly state why you are calling. Follow your system instructions. Keep it to 2-3 sentences. Do NOT use any markdown formatting, asterisks, or special characters - speak naturally as if on a phone call.'
        );
        greeting = aiGreeting;
        console.log(`[Twilio Webhook] LLM Greeting: ${greeting}`);

        // Save AI greeting to transcript
        await prisma.callTranscript.create({
          data: { callLogId, role: 'AI', message: greeting, tenantId: (await prisma.voiceCallLog.findUnique({ where: { id: callLogId } }))?.tenantId || '' }
        });
      } catch (err) {
        console.error('[Twilio Webhook] Error generating greeting:', err);
      }
    }

    // TwiML: Say the greeting, then listen for candidate's speech response
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${this.escapeXml(gatherUrl)}" method="POST" speechTimeout="3" language="en-IN">
    <Say voice="Polly.Aditi">${this.escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="Polly.Aditi">I did not hear a response. Thank you for your time. Goodbye.</Say>
</Response>`;

    console.log(`[Twilio Webhook] Returning TwiML with Gather action: ${gatherUrl}`);
    res.set('Content-Type', 'text/xml');
    res.send(xml);
  });

  // 2) GATHER CALLBACK: Twilio calls this each time the candidate speaks.
  //    We take their speech, send it to Gemini, and respond with the AI's next line + another <Gather>.
  twilioGather = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const callLogId = req.query.callLogId as string;
    const speechResult = req.body.SpeechResult || '';
    const backendUrl = process.env.BACKEND_URL || `https://${req.headers.host}`;
    const gatherUrl = `${backendUrl}/api/v1/voice-agent/twilio/gather?callLogId=${callLogId || ''}`;

    console.log(`[Twilio Gather] Candidate said: "${speechResult}"`);

    let aiResponse = 'I see. Is there anything else you would like to discuss?';

    if (callLogId && speechResult) {
      try {
        // Save candidate's speech to transcript
        const callLog = await prisma.voiceCallLog.findUnique({ where: { id: callLogId } });
        const tenantId = callLog?.tenantId || '';

        await prisma.callTranscript.create({
          data: { callLogId, role: 'USER', message: speechResult, tenantId }
        });

        // Fetch full conversation history from DB
        const transcripts = await prisma.callTranscript.findMany({
          where: { callLogId },
          orderBy: { createdAt: 'asc' }
        });

        // Convert to Gemini chat history format
        const conversationHistory = transcripts.map(t => ({
          role: t.role === 'AI' ? 'model' as const : 'user' as const,
          parts: [{ text: t.message }]
        }));

        // Build system prompt and get AI response
        const systemPrompt = await this.buildSystemPrompt(callLogId);
        aiResponse = await this.askGemini(
          systemPrompt + '\n\nIMPORTANT: Keep your responses concise (2-3 sentences max) since this is a phone call. Do NOT use markdown, asterisks, bullet points, or any special formatting. Speak naturally as if on a phone conversation.',
          conversationHistory,
          speechResult
        );

        console.log(`[Twilio Gather] AI Response: ${aiResponse}`);

        // Save AI response to transcript
        await prisma.callTranscript.create({
          data: { callLogId, role: 'AI', message: aiResponse, tenantId }
        });
      } catch (err) {
        console.error('[Twilio Gather] Error:', err);
      }
    }

    // Check if AI wants to end the call (look for goodbye-like phrases)
    const lowerResponse = aiResponse.toLowerCase();
    const isGoodbye = lowerResponse.includes('goodbye') || lowerResponse.includes('good bye') || lowerResponse.includes('have a great day') || lowerResponse.includes('thank you for your time');

    let xml: string;
    if (isGoodbye) {
      // End the call after the final message
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">${this.escapeXml(aiResponse)}</Say>
  <Hangup/>
</Response>`;

      // Update call log status
      if (callLogId) {
        await prisma.voiceCallLog.update({ where: { id: callLogId }, data: { status: 'COMPLETED' } }).catch(() => {});
      }
    } else {
      // Continue the conversation loop
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${this.escapeXml(gatherUrl)}" method="POST" speechTimeout="3" language="en-IN">
    <Say voice="Polly.Aditi">${this.escapeXml(aiResponse)}</Say>
  </Gather>
  <Say voice="Polly.Aditi">I did not hear a response. Thank you for your time. Goodbye.</Say>
</Response>`;
    }

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
