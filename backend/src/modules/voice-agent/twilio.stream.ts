import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { logger } from '../../shared/logger/logger';
import { env } from '../../config/env.validation';
const { createClient } = require('@deepgram/sdk');
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../../core/base/base.model';
import { sendInterviewScheduledByAIEmail } from '../../shared/utils/mailer';

export function setupTwilioWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/api/v1/voice-agent/twilio-stream')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (ws: WebSocket, req) => {
    logger.info(`[Twilio Stream] New WebSocket connection from ${req.socket.remoteAddress}`);
    
    // Parse callLogId from URL query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const callLogId = url.searchParams.get('callLogId');
    
    let streamSid: string | null = null;
    let callSid: string | null = null;
    let fullTranscript: string = '';
    
    let systemPrompt = 'You are an HR Assistant for PeopleFlow. You are conducting an initial phone screening with a candidate. Ask one question at a time.';
    
    if (callLogId) {
      try {
        const callLog = await prisma.voiceCallLog.findUnique({
          where: { id: callLogId },
          include: { campaign: { include: { configurations: true } } }
        });
        const campaignPrompt = callLog?.campaign?.configurations?.[0]?.systemPrompt;
        if (campaignPrompt) {
          systemPrompt = campaignPrompt;
        }
      } catch (err) {
        logger.error('Error fetching campaign prompt', { err });
      }
    }
    
    // Check API Keys
    if (!env.DEEPGRAM_API_KEY) {
      logger.error('DEEPGRAM_API_KEY is not set. Speech-to-Text will not work.');
      ws.close();
      return;
    }

    const llmApiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
    if (!llmApiKey) {
      logger.error('LLM API Key (GEMINI_API_KEY or OPENAI_API_KEY) is not set.');
      ws.close();
      return;
    }

    const deepgram = createClient(env.DEEPGRAM_API_KEY);
    let keepAlive: NodeJS.Timeout;

    // --- Setup Deepgram STT ---
    const dgConnection = deepgram.listen.live({
      model: 'nova-2',
      language: 'en-IN',
      smart_format: true,
      encoding: 'mulaw',
      sample_rate: 8000,
      channels: 1,
      endpointing: 300,
    });

    dgConnection.on('open', () => {
      logger.info('[Deepgram STT] Connection opened');
      keepAlive = setInterval(() => {
        dgConnection.keepAlive();
      }, 10 * 1000);
    });

    dgConnection.on('error', (err: any) => {
      logger.error('[Deepgram STT] Error', { err });
    });

    const sendAudioToTwilio = async (text: string) => {
      try {
        const response = await deepgram.speak.request(
          { text },
          { model: 'aura-asteria-en', encoding: 'mulaw', sample_rate: 8000 }
        );
        const stream = await response.getStream();
        if (stream) {
          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const base64Audio = Buffer.from(value).toString('base64');
            const message = {
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: base64Audio
              }
            };
            ws.send(JSON.stringify(message));
          }
        }
      } catch (error) {
        logger.error('[Deepgram TTS] Error', { error });
      }
    };

    const genAI = new GoogleGenerativeAI(llmApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Got it. I will follow those instructions and ask one question at a time.' }] }
      ]
    });

    dgConnection.on('transcript', async (data: any) => {
      const transcript = data.channel.alternatives[0].transcript;
      if (transcript && data.is_final) {
        logger.info(`[User]: ${transcript}`);
        fullTranscript += `\nCandidate: ${transcript}`;
        
        try {
          const result = await chatSession.sendMessage(transcript);
          const responseText = result.response.text().trim();
          logger.info(`[AI]: ${responseText}`);
          fullTranscript += `\nAI: ${responseText}`;
          await sendAudioToTwilio(responseText);
        } catch (err) {
          logger.error('[LLM] Error', { err });
        }
      }
    });

    ws.on('message', (message: string) => {
      try {
        const msg = JSON.parse(message);
        
        if (msg.event === 'start') {
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          logger.info(`[Twilio Stream] Started stream: ${streamSid} for call: ${callSid}`);
          
          const greeting = "Hello! This is the PeopleFlow AI Voice Assistant. Am I speaking with the candidate?";
          fullTranscript += `\nAI: ${greeting}`;
          sendAudioToTwilio(greeting);
        } 
        else if (msg.event === 'media') {
          const buffer = Buffer.from(msg.media.payload, 'base64');
          if (dgConnection && dgConnection.getReadyState() === 1) { 
            dgConnection.send(buffer);
          }
        } 
        else if (msg.event === 'stop') {
          logger.info(`[Twilio Stream] Stopped stream: ${streamSid}`);
          dgConnection.finish();
          clearInterval(keepAlive);
          
          // Post-call Processing: Save Transcript & Schedule Interview
          if (callLogId) {
            handlePostCall(callLogId, fullTranscript, llmApiKey).catch(err => {
              logger.error('Error in post-call processing', { err });
            });
          }
        }
      } catch (err) {
        logger.error('[Twilio Stream] Message parsing error', { err });
      }
    });

    ws.on('close', () => {
      logger.info(`[Twilio Stream] Connection closed`);
      dgConnection.finish();
      clearInterval(keepAlive);
    });
  });
}

async function handlePostCall(callLogId: string, transcript: string, apiKey: string) {
  // 1. Update Call Log with Transcript
  const callLog = await prisma.voiceCallLog.update({
    where: { id: callLogId },
    data: {
      transcript,
      status: 'COMPLETED',
      endTime: new Date()
    },
    include: { candidate: true }
  });

  // 2. Analyze Transcript to see if Interview should be scheduled
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(`Analyze the following phone screening transcript. Did the AI and the Candidate agree to schedule an interview? Reply ONLY with YES or NO.\n\nTranscript:\n${transcript}`);
  
  const isInterviewScheduled = result.response.text().trim().toUpperCase().includes('YES');

  if (isInterviewScheduled && callLog.candidateId) {
    const candidate = callLog.candidate;
    if (candidate) {
      logger.info(`Scheduling interview for candidate ${candidate.firstName}`);
      
      // Get candidate's latest application
      const application = await prisma.application.findFirst({
        where: { candidateId: candidate.id },
        orderBy: { appliedAt: 'desc' },
        include: { job: true }
      });

      if (application) {
        // Schedule Interview logic
        const interviewTime = new Date();
        interviewTime.setDate(interviewTime.getDate() + 2); // 2 days from now

        await prisma.interview.create({
          data: {
            tenantId: callLog.tenantId,
            organizationId: candidate.organizationId,
            candidateId: candidate.id,
            applicationId: application.id,
            jobId: application.jobId,
            roundName: 'Initial HR Phone Screen Follow-up',
            interviewType: 'HR',
            interviewMode: 'ONLINE',
            duration: 30,
            scheduledAt: interviewTime,
            status: 'SCHEDULED',
            meetingLink: 'https://meet.google.com/new-meeting-id', // Placeholder Meet Link
          }
        });

        // Send email to Admin
        const adminEmail = env.SMTP_FROM_EMAIL || 'admin@peopleflow.com';
        await sendInterviewScheduledByAIEmail(
          adminEmail, 
          `${candidate.firstName} ${candidate.lastName}`, 
          application.job?.title || 'Job Position', 
          interviewTime.toLocaleString()
        );
        logger.info(`[EMAIL] Notified Admin about scheduled interview for ${candidate.firstName} ${candidate.lastName}`);
      } else {
        logger.warn(`Could not schedule interview: No application found for candidate ${candidate.id}`);
      }
    }
  }
}
