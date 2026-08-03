import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { appConfig } from '../../config';

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

  async startCall(context: ServiceContext, data: { campaignId: string, candidateId?: string, employeeId?: string, phoneNumber?: string }) {
    const campaign = await prisma.voiceCampaign.findUnique({
      where: { id: data.campaignId, tenantId: context.tenantId },
      include: { configurations: true }
    });

    if (!campaign) throw new AppError('Campaign not found', 404);

    const callLog = await prisma.voiceCallLog.create({
      data: {
        tenantId: context.tenantId,
        campaignId: data.campaignId,
        candidateId: data.candidateId,
        employeeId: data.employeeId,
        status: 'IN_PROGRESS'
      },
      include: { campaign: { include: { configurations: true } } }
    });

    // If phoneNumber is provided, dial out via Exotel
    if (data.phoneNumber) {
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
}
