import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { appConfig } from '../../config';
import { emailService } from '../../integrations/email/email.service';

export class VoiceAgentService extends BaseService {
  
  async getCampaigns(context: ServiceContext) {
    return await prisma.voiceCampaign.findMany({
      where: { tenantId: context.tenantId },
      include: {
        _count: { select: { callLogs: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCampaign(context: ServiceContext, data: any) {
    return await prisma.voiceCampaign.create({
      data: {
        tenantId: context.tenantId,
        name: data.name,
        description: data.description,
        type: data.type || 'SCREENING',
        configurations: {
          create: {
            tenantId: context.tenantId,
            systemPrompt: data.systemPrompt || 'You are a helpful AI HR assistant.',
            voiceSettings: data.voiceSettings || {}
          }
        }
      }
    });
  }

  async startCall(context: ServiceContext, data: { campaignId: string, candidateId?: string, employeeId?: string, phoneNumber?: string, callMethod?: string }) {
    const campaign = await prisma.voiceCampaign.findUnique({
      where: { id: data.campaignId, tenantId: context.tenantId },
      include: { configurations: true }
    });

    if (!campaign) throw new AppError('Campaign not found', 404);
    
    const callMethod = data.callMethod || (data.phoneNumber ? 'MOBILE' : 'BROWSER');

    let resolvedCandidateId = data.candidateId;
    if (resolvedCandidateId) {
       const isCandidate = await prisma.candidate.findUnique({ where: { id: resolvedCandidateId } });
       if (!isCandidate) {
          const isUserCandidate = await prisma.candidate.findFirst({ where: { userId: resolvedCandidateId } });
          if (isUserCandidate) {
             resolvedCandidateId = isUserCandidate.id;
          } else {
             const user = await prisma.user.findUnique({ where: { id: resolvedCandidateId } });
             if (user) {
                const jobApp = await prisma.jobApplication.findFirst({
                   where: { candidateId: user.id },
                   include: { job: true }
                });
                const orgId = jobApp?.job?.organizationId || context.tenantId;
                const newCandidate = await prisma.candidate.create({
                   data: {
                      tenantId: context.tenantId,
                      organizationId: orgId,
                      userId: user.id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email,
                      phone: user.phone || ''
                   }
                });
                resolvedCandidateId = newCandidate.id;
             } else {
                resolvedCandidateId = undefined;
             }
          }
       }
    }

    const callLog = await prisma.voiceCallLog.create({
      data: {
        tenantId: context.tenantId,
        campaignId: data.campaignId,
        candidateId: resolvedCandidateId,
        employeeId: data.employeeId,
        status: 'IN_PROGRESS',
        callMethod
      },
      include: { campaign: { include: { configurations: true } } }
    });

    if (callMethod === 'BROWSER') {
       let recipientEmail = '';
       let recipientName = 'User';
       if (resolvedCandidateId) {
          const candidate = await prisma.candidate.findUnique({ where: { id: resolvedCandidateId } });
          if (candidate) { recipientEmail = candidate.email; recipientName = candidate.firstName; }
       } else if (data.employeeId) {
          const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
          if (employee) { recipientEmail = employee.email; recipientName = employee.firstName; }
       }
       if (recipientEmail) {
          const frontendUrl = process.env.FRONTEND_URL || 'https://people-flow-rose.vercel.app';
          const callLink = `${frontendUrl}/public/call/${callLog.id}`;
          const html = `
             <h2>Hi ${recipientName},</h2>
             <p>You have been invited to an AI-powered voice session for: <b>${campaign.name}</b>.</p>
             <p>Please click the link below to join the call in your browser. Ensure your microphone is ready.</p>
             <a href="${callLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Join Call Now</a>
          `;
          await emailService.sendEmail(recipientEmail, 'AI Voice Session: ' + campaign.name, html);
       }
    } else if (data.phoneNumber) {
      try {
        const exotelApiKey = process.env.EXOTEL_API_KEY;
        const exotelApiToken = process.env.EXOTEL_API_TOKEN;
        const exotelAccountSid = process.env.EXOTEL_ACCOUNT_SID;
        const exotelVirtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER || '09513886363';
        // IMPORTANT: This must be the BACKEND public URL (not frontend)
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        if (!exotelApiKey || !exotelApiToken || !exotelAccountSid) {
          throw new Error('Exotel credentials not configured in .env');
        }

        const authHeader = Buffer.from(`${exotelApiKey}:${exotelApiToken}`).toString('base64');
        const exotelUrl = `https://api.exotel.com/v1/Accounts/${exotelAccountSid}/Calls/connect.json`;

        // The webhook where Exotel gets instructions to connect to our WebSocket Stream
        const webhookUrl = `${backendUrl}/api/v1/voice-agent/exotel/webhook?callLogId=${callLog.id}`;

        const formData = new URLSearchParams();
        formData.append('From', exotelVirtualNumber);
        formData.append('To', data.phoneNumber);
        formData.append('Url', webhookUrl);

        const exotelRes = await fetch(exotelUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });

        if (!exotelRes.ok) {
          const errBody = await exotelRes.text();
          console.error('Exotel Call Error:', errBody);
          throw new Error('Exotel API Error: ' + errBody);
        }
      } catch (err) {
        console.error('Failed to trigger Exotel outbound call:', err);
        // We log the error but still return the callLog to frontend
      }
    }

    return callLog;
  }

  async saveTranscript(context: ServiceContext, callLogId: string, role: string, message: string) {
    // Basic authorization check
    const callLog = await prisma.voiceCallLog.findUnique({ where: { id: callLogId } });
    if (!callLog || callLog.tenantId !== context.tenantId) {
      throw new AppError('Call log not found', 404);
    }

    return await prisma.callTranscript.create({
      data: {
        tenantId: context.tenantId,
        callLogId,
        role,
        message
      }
    });
  }

  async generateAIResponse(context: ServiceContext, callLogId: string, userMessage: string) {
    // 1. Save user message to transcript
    await this.saveTranscript(context, callLogId, 'USER', userMessage);

    // 2. Fetch full transcript and system prompt
    const callLog = await prisma.voiceCallLog.findUnique({
      where: { id: callLogId },
      include: {
        transcripts: { orderBy: { createdAt: 'asc' } },
        campaign: { include: { configurations: true } }
      }
    });

    if (!callLog) throw new AppError('Call log not found', 404);

    const config = callLog.campaign.configurations[0];
    const systemPrompt = config?.systemPrompt || 'You are a helpful AI HR assistant.';
    
    // 3. Call LLM (Groq / Gemini)
    let aiResponseText = 'I am sorry, I am currently unable to process your request.';

    try {
      // Dummy key fallback
      const apiKey = process.env.GROQ_API_KEY || 'dummy';
      if (apiKey === 'dummy') {
        aiResponseText = `[Simulated AI Response] I heard you say: "${userMessage}". This is a placeholder since a valid Groq/Gemini API key was not provided in the .env file.`;
      } else {
        // Prepare messages for Groq API
        const messages = [
          { role: 'system', content: systemPrompt },
          ...callLog.transcripts.map(t => ({
            role: t.role.toLowerCase() === 'ai' ? 'assistant' : 'user',
            content: t.message
          }))
        ];

        // Ensure we add the latest user message
        if (messages[messages.length - 1].content !== userMessage) {
           messages.push({ role: 'user', content: userMessage });
        }

        // Call Groq (using raw fetch for minimal dependency overhead)
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192', // Fast model suitable for voice
            messages: messages,
            temperature: 0.5,
            max_tokens: 150 // Keep responses brief for voice
          })
        });

        const data = await res.json() as any;
        if (data.choices && data.choices.length > 0) {
          aiResponseText = data.choices[0].message.content;
        } else {
          console.error('Groq Error:', data);
          aiResponseText = 'Sorry, there was an error processing your response with the AI.';
        }
      }
    } catch (err) {
      console.error('AI Generation Error:', err);
      aiResponseText = 'Sorry, the AI service is currently down.';
    }

    // 4. Save AI response to transcript
    await this.saveTranscript(context, callLogId, 'AI', aiResponseText);

    return { response: aiResponseText };
  }

  async getCallLogs(context: ServiceContext, campaignId?: string) {
    return await prisma.voiceCallLog.findMany({
      where: {
        tenantId: context.tenantId,
        ...(campaignId && { campaignId })
      },
      include: {
        candidate: true,
        employee: true,
        campaign: true,
        _count: { select: { transcripts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async getCallTranscript(context: ServiceContext, callLogId: string) {
    const log = await prisma.voiceCallLog.findUnique({
      where: { id: callLogId, tenantId: context.tenantId },
      include: {
        transcripts: { orderBy: { createdAt: 'asc' } },
        campaign: true,
        candidate: true,
        employee: true
      }
    });

    if (!log) throw new AppError('Call log not found', 404);
    return log;
  }

  // --- Public Browser Calling Methods ---

  async getPublicCallInfo(callLogId: string) {
    const log = await prisma.voiceCallLog.findUnique({
      where: { id: callLogId },
      include: {
        campaign: true,
        candidate: true,
        employee: true
      }
    });
    if (!log) throw new AppError('Call session not found', 404);
    if (log.status !== 'IN_PROGRESS') throw new AppError('Call session has ended or failed', 400);
    return log;
  }

  async publicInteract(callLogId: string, userMessage: string) {
    const callLog = await prisma.voiceCallLog.findUnique({
      where: { id: callLogId }
    });
    if (!callLog) throw new AppError('Call session not found', 404);
    if (callLog.status !== 'IN_PROGRESS') throw new AppError('Call session is not active', 400);

    const dummyContext: any = { tenantId: callLog.tenantId };
    return await this.generateAIResponse(dummyContext, callLogId, userMessage);
  }

  async endCallPublic(callLogId: string) {
    const callLog = await prisma.voiceCallLog.findUnique({
      where: { id: callLogId },
      include: {
        transcripts: { orderBy: { createdAt: 'asc' } },
        campaign: { include: { configurations: true } }
      }
    });
    if (!callLog) throw new AppError('Call session not found', 404);
    
    let summary = 'No summary generated.';
    try {
      const apiKey = process.env.GROQ_API_KEY || 'dummy';
      if (apiKey === 'dummy') {
        summary = 'Simulated summary: The call concluded successfully. This is a placeholder since a valid API key was not provided.';
      } else {
        const transcriptText = callLog.transcripts.map(t => `${t.role}: ${t.message}`).join('\n');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: 'You are an AI assistant. Summarize the following conversation in 2-3 short sentences highlighting the key points discussed.' },
              { role: 'user', content: transcriptText }
            ],
            temperature: 0.3,
            max_tokens: 200
          })
        });
        const data = await res.json() as any;
        if (data.choices && data.choices.length > 0) {
           summary = data.choices[0].message.content;
        }
      }
    } catch (err) {
      console.error('Summary generation error', err);
    }

    return await prisma.voiceCallLog.update({
      where: { id: callLogId },
      data: { status: 'COMPLETED', summary }
    });
  }
}
