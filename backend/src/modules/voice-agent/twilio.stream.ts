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
      console.log(`[WS Upgrade] Upgrading connection for: ${request.url}`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (ws: WebSocket, req) => {
    console.log(`[Twilio Stream] New WebSocket connection from ${req.socket.remoteAddress}`);
    logger.info(`[Twilio Stream] New WebSocket connection from ${req.socket.remoteAddress}`);
    
    // Parse callLogId from URL query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const callLogId = url.searchParams.get('callLogId');
    console.log(`[Twilio Stream] callLogId: ${callLogId}`);
    
    let streamSid: string | null = null;
    let callSid: string | null = null;
    let fullTranscript: string = '';
    
    let isReady = false;
    const messageQueue: string[] = [];
    
    // Declare these variables so they can be accessed inside processMessage and close handlers
    let keepAlive: NodeJS.Timeout | null = null;
    let chatSession: any = null;
    const llmApiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || env.OPENAI_API_KEY || '';

    // Attach message listener immediately to prevent dropping events
    ws.on('message', (message: string) => {
      if (!isReady) {
        messageQueue.push(message.toString());
      } else {
        processMessage(message.toString());
      }
    });

    ws.on('close', () => {
      console.log(`[Twilio Stream] WebSocket closed for ${streamSid || 'unknown'}`);
      if (keepAlive) clearInterval(keepAlive);
    });

    // -----------------------------------------------------------------
    // ASYNC INITIALIZATION
    // -----------------------------------------------------------------
    let systemPrompt = 'You are an HR Assistant for PeopleFlow. You are conducting an initial phone screening with a candidate. Ask one question at a time.';
    
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
        console.log(`[Twilio Stream] CallLog found: ${!!callLog}, Campaign: ${callLog?.campaign?.name}`);
        const campaignPrompt = callLog?.campaign?.configurations?.[0]?.systemPrompt;
        if (campaignPrompt) {
          systemPrompt = campaignPrompt;
          console.log(`[Twilio Stream] Using campaign prompt: ${campaignPrompt.substring(0, 100)}...`);
        } else {
          console.log(`[Twilio Stream] No campaign prompt found, using default`);
        }
        
        // Append Candidate and Job info to system prompt so the AI can answer contextually
        if (callLog?.candidate) {
          const c = callLog.candidate;
          systemPrompt += `\n\n### CANDIDATE INFORMATION ###\nName: ${c.firstName} ${c.lastName}\nEmail: ${c.email}\nPhone: ${c.phone || 'N/A'}\nTotal Experience: ${c.totalExperience || 0} years\nCurrent Company: ${c.currentCompany || 'N/A'}\nExpected Salary: ${c.expectedSalary || 'N/A'}`;
        }
        if (callLog?.jobOpening) {
          const j = callLog.jobOpening;
          systemPrompt += `\n\n### JOB OPENING DETAILS ###\nTitle: ${j.title}\nEmployment Type: ${j.employmentType}\nWork Mode: ${j.workMode}\nRequired Experience: ${j.experienceMin || 0} - ${j.experienceMax || 'Any'} years\nDescription: ${j.publicDescription || 'N/A'}`;
        }
      } catch (err) {
        console.error('[Twilio Stream] Error fetching campaign prompt', err);
        logger.error('Error fetching campaign prompt', { err });
      }
    }
    
    // Check API Keys
    console.log(`[Twilio Stream] DEEPGRAM_API_KEY set: ${!!env.DEEPGRAM_API_KEY}`);
    console.log(`[Twilio Stream] LLM API Key set: ${!!llmApiKey}`);
    
    if (!env.DEEPGRAM_API_KEY) {
      console.error('[Twilio Stream] DEEPGRAM_API_KEY is not set! Closing WebSocket.');
      logger.error('DEEPGRAM_API_KEY is not set. Speech-to-Text will not work.');
      ws.close();
      return;
    }

    if (!llmApiKey) {
      console.error('[Twilio Stream] LLM API Key is not set! Closing WebSocket.');
      logger.error('LLM API Key (GEMINI_API_KEY or OPENAI_API_KEY) is not set.');
      ws.close();
      return;
    }

    const deepgram = createClient(env.DEEPGRAM_API_KEY);

    const sendAudioToTwilio = async (text: string) => {
      try {
        console.log(`[Deepgram TTS] Generating audio for: "${text.substring(0, 80)}..."`);
        const response = await deepgram.speak.request(
          { text },
          { model: 'aura-asteria-en', encoding: 'mulaw', sample_rate: 8000, container: 'none' }
        );
        const stream = await response.getStream();
        if (stream) {
          const reader = stream.getReader();
          let chunkCount = 0;
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
            chunkCount++;
            
            // Throttle sending to Twilio to prevent buffer overrun. 
            // Deepgram generates audio 10x faster than real-time, which overflows Twilio's ingest buffers if sent instantly.
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          console.log(`[Deepgram TTS] Sent ${chunkCount} audio chunks to Twilio`);
          
          // Send mark event so we know when audio finishes playing
          const markMessage = {
            event: 'mark',
            streamSid: streamSid,
            mark: {
              name: 'tts_finished'
            }
          };
          ws.send(JSON.stringify(markMessage));
        } else {
          console.error('[Deepgram TTS] No stream returned from speak.request');
        }
      } catch (error) {
        console.error('[Deepgram TTS] Error:', error);
        logger.error('[Deepgram TTS] Error', { error });
      }
    };

    const processMessage = (message: string) => {
      try {
        const msg = JSON.parse(message);
        
        if (msg.event === 'start') {
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          console.log(`[Twilio Stream] Started stream: ${streamSid} for call: ${callSid}`);
          logger.info(`[Twilio Stream] Started stream: ${streamSid} for call: ${callSid}`);
          
          // Generate dynamic broadcast message using Gemini
          if (chatSession) {
             console.log(`[Twilio Stream] Asking Gemini for broadcast message...`);
             chatSession.sendMessage("Generate the one-way broadcast message based on the system prompt and candidate details. Do not ask questions, just deliver the message.").then(async (result: any) => {
                const greeting = result.response.text().trim();
                fullTranscript += `\nAI: ${greeting}`;
                console.log(`[Twilio Stream] Sending dynamic broadcast message via TTS...`);
                await sendAudioToTwilio(greeting);
             }).catch((err: any) => {
                console.error('[Twilio Stream] Failed to get initial greeting from Gemini', err);
                const backupGreeting = "Hello! This is the AI assistant calling. How are you today?";
                sendAudioToTwilio(backupGreeting);
             });
          }
        } 
        else if (msg.event === 'media') {
          // We ignore user media because this is a one-way broadcast
        } 
        else if (msg.event === 'mark') {
          if (msg.mark?.name === 'tts_finished') {
            console.log('[Twilio Stream] TTS finished playing. Hanging up.');
            ws.close();
          }
        }
        else if (msg.event === 'stop') {
          console.log(`[Twilio Stream] Stopped stream: ${streamSid}`);
          logger.info(`[Twilio Stream] Stopped stream: ${streamSid}`);
          if (keepAlive) clearInterval(keepAlive);
          
          // Post-call Processing: Save Transcript & Schedule Interview
          if (callLogId) {
            handlePostCall(callLogId, fullTranscript, llmApiKey).catch(err => {
              console.error('[Post-call] Error in post-call processing', err);
              logger.error('Error in post-call processing', { err });
            });
          }
        }
      } catch (err) {
        console.error('[Twilio Stream] Message parsing error', err);
        logger.error('[Twilio Stream] Message parsing error', { err });
      }
    };

    const genAI = new GoogleGenerativeAI(llmApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Got it. I will deliver the message based on the context provided.' }] }
      ]
    });
    console.log(`[Twilio Stream] Gemini chat session initialized with system prompt`);

    // -----------------------------------------------------------------
    // FLUSH QUEUED MESSAGES
    // -----------------------------------------------------------------
    isReady = true;
    console.log(`[Twilio Stream] Ready! Flushing ${messageQueue.length} queued messages`);
    for (const msg of messageQueue) {
      processMessage(msg);
    }
    messageQueue.length = 0; // Clear the queue
  });
}

async function handlePostCall(callLogId: string, transcript: string, apiKey: string) {
  // 1. Update Call Log with Transcript (stored in 'summary' field)
  const callLog = await prisma.voiceCallLog.update({
    where: { id: callLogId },
    data: {
      summary: transcript,
      status: 'COMPLETED',
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
