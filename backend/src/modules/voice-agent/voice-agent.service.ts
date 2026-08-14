import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { appConfig } from '../../config';
import { emailService } from '../../integrations/email/email.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import { RestClient } from '@signalwire/compatibility-api';
export class VoiceAgentService extends BaseService {
  
  async getCampaigns(context: ServiceContext) {
    return await prisma.voiceCampaign.findMany({
      where: { tenantId: context.tenantId },
      include: {
        _count: { select: { callLogs: true } },
        configurations: true
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

  async updateCampaign(context: ServiceContext, campaignId: string, data: any) {
    const campaign = await prisma.voiceCampaign.findUnique({ where: { id: campaignId, tenantId: context.tenantId }});
    if (!campaign) throw new AppError('Campaign not found', 404);

    return await prisma.voiceCampaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        configurations: {
          updateMany: {
            where: { campaignId },
            data: {
              systemPrompt: data.systemPrompt,
              voiceSettings: data.voiceSettings
            }
          }
        }
      }
    });
  }

  async deleteCampaign(context: ServiceContext, campaignId: string) {
    const campaign = await prisma.voiceCampaign.findUnique({ where: { id: campaignId, tenantId: context.tenantId }});
    if (!campaign) throw new AppError('Campaign not found', 404);

    await prisma.voiceCampaign.delete({ where: { id: campaignId } });
    return { success: true };
  }

  async startCall(context: ServiceContext, data: { campaignId: string, candidateId?: string, employeeId?: string, phoneNumber?: string }) {
    const campaign = await prisma.voiceCampaign.findUnique({
      where: { id: data.campaignId, tenantId: context.tenantId },
      include: { configurations: true }
    });

    if (!campaign) throw new AppError('Campaign not found', 404);
    
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

    if (!data.phoneNumber && resolvedCandidateId) {
       const candidate = await prisma.candidate.findUnique({ where: { id: resolvedCandidateId } });
       if (candidate?.phone) {
          data.phoneNumber = candidate.phone;
       }
    }


    const callLog = await prisma.voiceCallLog.create({
      data: {
        tenantId: context.tenantId,
        campaignId: data.campaignId,
        candidateId: resolvedCandidateId,
        employeeId: data.employeeId,
        status: 'INITIATED'
      },
      include: { campaign: { include: { configurations: true } } }
    });

    if (data.phoneNumber) {
      try {
        const backendUrl = process.env.BACKEND_URL;

        if (!backendUrl) {
          throw new Error('BACKEND_URL is not configured in .env.');
        }

        // --- BUILD GREETING DIRECTLY FROM CAMPAIGN/JOB/CANDIDATE DATA ---
        // No LLM call needed — we build a specific, relevant greeting from the actual data
        const fullCallLog = await prisma.voiceCallLog.findUnique({
          where: { id: callLog.id },
          include: {
            campaign: { include: { configurations: true } },
            candidate: true,
            jobOpening: true
          }
        });

        const candidateName = fullCallLog?.candidate
          ? `${fullCallLog.candidate.firstName} ${fullCallLog.candidate.lastName}`.trim()
          : 'there';
        const campaignName = fullCallLog?.campaign?.name || '';

        // --- Veytrix Integration ---
        const veytrixApiKey = process.env.VEYTRIX_API_KEY;
        const veytrixAgentId = process.env.VEYTRIX_AGENT_ID;
        const veytrixPhoneNumber = process.env.VEYTRIX_VERIFIED_MOBILE_NUMBER;

        if (!veytrixApiKey || !veytrixAgentId) {
          console.warn('Veytrix credentials missing. Please set VEYTRIX_API_KEY and VEYTRIX_AGENT_ID in .env');
          throw new AppError('Veytrix credentials missing from environment variables', 500);
        }

        const webhookUrl = `${backendUrl}/api/v1/voice-agent/veytrix/webhook?callLogId=${callLog.id}`;

        console.log(`[Veytrix Call] Initiating call to ${data.phoneNumber}`);

        const veytrixBaseUrl = process.env.VEYTRIX_BASE_URL || 'https://nxtwave-screening.fly.dev';
        const response = await fetch(`${veytrixBaseUrl}/api/alert`, { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${veytrixApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agentId: veytrixAgentId,
            phones: [
              { name: candidateName, phone: data.phoneNumber }
            ],
            variables: {
              candidate_name: candidateName,
              campaign_name: campaignName,
              webhook_url: webhookUrl
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Veytrix API Error: ${response.status} - ${errorText}`);
        }

        const veytrixData = (await response.json()) as any;
        const returnedCallId = veytrixData.calls?.[0]?.callId || veytrixData.id || veytrixData.call_id || 'unknown';
        console.log(`[Veytrix Call] Success! Call ID: ${returnedCallId}`);
        // ---------------------------

      } catch (err: any) {
        console.error('Failed to trigger Veytrix outbound call:', err?.message || err);
        throw new AppError(err?.message || 'Failed to initiate AI call', 500);
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
    // 1. Save user message to transcript ONLY if it's not a system init
    if (userMessage !== '[SYSTEM_INIT_CALL]') {
      await this.saveTranscript(context, callLogId, 'USER', userMessage);
    }

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
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        aiResponseText = `[Simulated AI Response] I heard you say: "${userMessage}". This is a placeholder since a valid GEMINI_API_KEY was not provided in the .env file.`;
      } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
           model: 'gemini-1.5-flash', 
           systemInstruction: systemPrompt 
        });

        const rawHistory = callLog.transcripts.reduce((acc: any[], t) => {
          const role = t.role.toLowerCase() === 'ai' ? 'model' : 'user';
          if (acc.length > 0 && acc[acc.length - 1].role === role) {
            acc[acc.length - 1].parts[0].text += '\n' + t.message;
          } else {
            acc.push({ role, parts: [{ text: t.message }] });
          }
          return acc;
        }, []);

        let promptText = userMessage;
        if (userMessage === '[SYSTEM_INIT_CALL]') {
           promptText = "You are initiating the call. Begin the conversation as if you just answered the phone. Follow your system instructions strictly and introduce yourself briefly.";
        }

        if (rawHistory.length > 0 && rawHistory[rawHistory.length - 1].role === 'user') {
           const lastUser = rawHistory.pop();
           if (userMessage !== '[SYSTEM_INIT_CALL]') {
               promptText = lastUser.parts[0].text;
           } else {
               promptText = lastUser.parts[0].text + '\n' + promptText;
           }
        }

        const chat = model.startChat({ history: rawHistory });
        const result = await chat.sendMessage(promptText);
        aiResponseText = result.response.text();
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
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        summary = 'Simulated summary: The call concluded successfully. This is a placeholder since a valid API key was not provided.';
      } else {
        const transcriptText = callLog.transcripts.map(t => `${t.role}: ${t.message}`).join('\n');
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `You are an AI assistant. Summarize the following conversation in 2-3 short sentences highlighting the key points discussed:\n\n${transcriptText}`;
        const result = await model.generateContent(prompt);
        summary = result.response.text();
      }
    } catch (err) {
      console.error('AI Summary Error:', err);
      summary = 'Failed to generate summary.';
    }

    return await prisma.voiceCallLog.update({
      where: { id: callLogId },
      data: { status: 'COMPLETED', summary }
    });
  }
}
