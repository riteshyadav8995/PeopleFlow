import { useState, useRef } from 'react';
import { Mic, Volume2, User, Loader2, StopCircle, Sparkles } from 'lucide-react';
import { api } from '../../../lib/api';
import './VoiceAgent.css';

export function VoiceAgent() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const recognitionRef = useRef<any>(null);

  // We assume there's a default "Employee Support" campaign ID on the backend
  // For the sake of this UI, we can use a hardcoded campaign ID or fetch the first active one.
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const startVoiceSession = async () => {
    try {
      // First, get a campaign (for demo, just fetch the first available one or create a dummy session)
      let campaignId = '';
      const campaignsRes = await api.get('/voice-agent/campaigns');
      if (campaignsRes.data.data && campaignsRes.data.data.length > 0) {
         campaignId = campaignsRes.data.data[0].id;
      } else {
         // Fallback if admin hasn't created one
         const newCamp = await api.post('/voice-agent/campaigns', {
           name: 'Employee Self-Service AI',
           systemPrompt: 'You are a helpful AI HR assistant for employees. Help them with leaves, payroll, and general company policies.',
           type: 'HR_SUPPORT'
         });
         campaignId = newCamp.data.data.id;
      }

      const callRes = await api.post('/voice-agent/calls', { campaignId });
      setActiveCallId(callRes.data.data.id);
      return callRes.data.data.id;
    } catch (err) {
      console.error("Failed to start voice session", err);
      setAiResponse("Sorry, failed to connect to the Voice AI system.");
      return null;
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!activeCallId) {
       setIsProcessing(true);
       setTranscript('Connecting to secure AI channel...');
       const callId = await startVoiceSession();
       setIsProcessing(false);
       if (!callId) return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleVoiceSubmit(text);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setTranscript('Listening...');
    setAiResponse('');
  };

  const handleVoiceSubmit = async (text: string) => {
    setIsProcessing(true);
    try {
      const res = await api.post(`/voice-agent/calls/${activeCallId}/interact`, { message: text });
      const reply = res.data.data.response;
      setAiResponse(reply);

      // Speak back
      const utterance = new SpeechSynthesisUtterance(reply);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Interaction failed", err);
      setAiResponse('Sorry, there was an error processing your voice command.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="employee-voice-container">
      <div className="employee-voice-header">
        <h1 className="employee-voice-title">
          <Sparkles className="text-brand-500" size={32} />
          AI Voice Assistant
        </h1>
        <p className="employee-voice-subtitle">Talk to your smart HR assistant hands-free to check leaves, payroll, or policies.</p>
      </div>

      <div className="employee-voice-main">
        
        {/* Dynamic Voice Visualizer */}
        <div className="mic-visualizer-wrapper">
          {isRecording && <div className="mic-pulse-ring"></div>}
          
          <button 
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`btn-big-mic ${isProcessing ? 'processing' : isRecording ? 'recording' : 'idle'}`}
            title={isRecording ? 'Tap to Stop' : 'Tap to Speak'}
          >
            {isProcessing ? <Loader2 size={48} className="animate-spin" /> : isRecording ? <StopCircle size={48} /> : <Mic size={48} />}
          </button>
        </div>

        {/* Live Status Text */}
        <div className="live-transcript-area">
          {transcript && (
            <div className="transcript-msg user">
              <User size={24} color="var(--text-secondary)" className="transcript-icon" />
              <div className="transcript-text user">"{transcript}"</div>
            </div>
          )}
          
          {aiResponse && (
            <div className="transcript-msg ai">
              <Volume2 size={24} color="var(--brand-500)" className="transcript-icon" style={{ marginTop: '2px' }} />
              <div className="transcript-text ai">{aiResponse}</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
