import { BaseService } from '../../core/base/base.service';
import { ServiceContext } from '../../core/interfaces/service-context.interface';
import { AppError } from '../../core/errors/app.error';
import { prisma } from '../../core/base/base.model';
import { appConfig } from '../../config';
import { emailService } from '../../integrations/email/email.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import twilio from 'twilio';
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

    // Hardcoded phone number for all candidates (testing)
    data.phoneNumber = '+919798800286';

    const callLog = await prisma.voiceCallLog.create({
      data: {
        tenantId: context.tenantId,
        campaignId: data.campaignId,
        candidateId: resolvedCandidateId,
        employeeId: data.employeeId,
        status: 'IN_PROGRESS'
      },
      include: { campaign: { include: { configurations: true } } }
    });

    if (data.phoneNumber) {
      try {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
        const backendUrl = process.env.BACKEND_URL;

        if (!twilioSid || !twilioToken || !twilioNumber) {
          throw new Error('Twilio credentials not configured in .env');
        }

        if (!backendUrl) {
          throw new Error('BACKEND_URL is not configured in .env.');
        }

        // --- GENERATE AI GREETING BEFORE MAKING THE CALL ---
        let greeting = 'Hello, this is the PeopleFlow AI Assistant calling regarding your job application. How are you today?';

        try {
          // Build system prompt from campaign + candidate + job data
          const fullCallLog = await prisma.voiceCallLog.findUnique({
            where: { id: callLog.id },
            include: {
              campaign: { include: { configurations: true } },
              candidate: true,
              jobOpening: true
            }
          });

          let systemPrompt = fullCallLog?.campaign?.configurations?.[0]?.systemPrompt || '';
          if (!systemPrompt || systemPrompt.trim() === '') {
            systemPrompt = 'You are a helpful HR Assistant for PeopleFlow calling a candidate about a job application.';
          }
          
          if (fullCallLog?.campaign) {
            systemPrompt += `\n\n### CAMPAIGN DETAILS ###\nName: ${fullCallLog.campaign.name}\nDescription: ${fullCallLog.campaign.description || 'N/A'}\nType: ${fullCallLog.campaign.type}`;
          }

          if (fullCallLog?.candidate) {
            const c = fullCallLog.candidate;
            systemPrompt += `\n\n### CANDIDATE INFORMATION ###\nName: ${c.firstName} ${c.lastName}\nEmail: ${c.email}\nPhone: ${c.phone || 'N/A'}\nTotal Experience: ${c.totalExperience || 0} years\nCurrent Company: ${c.currentCompany || 'N/A'}\nExpected Salary: ${c.expectedSalary || 'N/A'}`;
          }
          if (fullCallLog?.jobOpening) {
            const j = fullCallLog.jobOpening;
            systemPrompt += `\n\n### JOB OPENING DETAILS ###\nTitle: ${j.title}\nEmployment Type: ${j.employmentType}\nWork Mode: ${j.workMode}\nRequired Experience: ${j.experienceMin || 0} - ${j.experienceMax || 'Any'} years\nDescription: ${j.publicDescription || 'N/A'}`;
          }

          // Ask Gemini for the greeting
          const llmApiKey = (process.env.GEMINI_API_KEY || '').trim();
          if (llmApiKey) {
            const genAI = new GoogleGenerativeAI(llmApiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const chat = model.startChat({
              history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Understood. I am ready to follow these instructions.' }] }
              ]
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Gemini timeout')), 10000)
            );
            const geminiResult: any = await Promise.race([
              chat.sendMessage('You are initiating the call now. Greet the candidate by name, introduce yourself, and clearly state the purpose of this call based on the campaign details. End your greeting by asking them a question to start the conversation, such as "Do you have a few minutes to chat?" or "Is there anything you want to ask?". Keep it to 2-3 sentences. Do NOT use any markdown, asterisks, or special characters.'),
              timeoutPromise
            ]);
            greeting = geminiResult.response.text().trim();
            console.log(`[Twilio Call] Generated AI greeting: ${greeting}`);
          }
        } catch (greetingErr: any) {
          console.error('[Twilio Call] Failed to generate AI greeting, using default:', greetingErr?.message);
        }

        // Save AI greeting to transcript
        await prisma.callTranscript.create({
          data: { callLogId: callLog.id, role: 'AI', message: greeting, tenantId: context.tenantId }
        }).catch(() => {});

        // Escape XML special chars
        const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, (c) => {
          switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case "'": return '&apos;'; case '"': return '&quot;'; default: return c; }
        });

        // Build the TwiML INLINE — no webhook needed for the initial call
        const gatherUrl = `${backendUrl}/api/v1/voice-agent/twilio/gather?callLogId=${callLog.id}`;
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${escapeXml(gatherUrl)}" method="POST" speechTimeout="3" language="en-IN">
    <Say voice="Polly.Aditi">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="Polly.Aditi">I did not hear a response. Thank you for your time. Goodbye.</Say>
</Response>`;

        console.log(`[Twilio Call] Using url parameter with pre-generated greeting`);
        console.log(`[Twilio Call] Gather callback: ${gatherUrl}`);

        const client = twilio(twilioSid, twilioToken);
        const webhookUrl = `${backendUrl}/api/v1/voice-agent/twilio/webhook?callLogId=${callLog.id}`;
        
        console.log(`[Twilio Call] Webhook URL: ${webhookUrl}`);
        
        const call = await client.calls.create({
          url: webhookUrl,
          to: data.phoneNumber,
          from: twilioNumber,
        });
        
        console.log(`[Twilio Call] Success! SID: ${call.sid}`);
      } catch (err: any) {
        console.error('Failed to trigger Twilio outbound call:', err?.message || err);
        throw new AppError(err?.message || 'Failed to initiate Twilio call', 500);
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
           model: 'gemini-2.5-flash', 
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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
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
