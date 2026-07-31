import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, PhoneOff, Activity, User, Bot, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import './CallTranscriptView.css';

interface Transcript {
  id: string;
  role: string;
  message: string;
  createdAt: string;
}

interface CallLog {
  id: string;
  status: string;
  campaign: { name: string; type: string };
  transcripts: Transcript[];
}

export function CallTranscriptView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [callLog, setCallLog] = useState<CallLog | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCallDetails();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [callLog?.transcripts, isAISpeaking]);

  const fetchCallDetails = async () => {
    try {
      const res = await api.get(`/voice-agent/calls/${id}`);
      setCallLog(res.data.data);
    } catch (error) {
      console.error('Error fetching call', error);
    }
  };

  const handleVoiceInput = async (text: string) => {
    try {
      // Optimistically update UI
      const mockUserTs: Transcript = { id: Date.now().toString(), role: 'USER', message: text, createdAt: new Date().toISOString() };
      setCallLog(prev => prev ? { ...prev, transcripts: [...prev.transcripts, mockUserTs] } : null);
      
      setIsAISpeaking(true);

      const res = await api.post(`/voice-agent/calls/${id}/interact`, { message: text });
      const aiResponse = res.data.data.response;
      
      // Speak it back
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.onend = () => setIsAISpeaking(false);
      window.speechSynthesis.speak(utterance);

      fetchCallDetails();
    } catch (error) {
      console.error('Error interacting with AI', error);
      setIsAISpeaking(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  if (!callLog) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Activity className="animate-spin text-brand-500" style={{ marginRight: '0.5rem' }} /> Loading Call Session...
      </div>
    );
  }

  return (
    <div className="call-transcript-container">
      
      {/* Header */}
      <div className="call-header">
        <div className="call-header-info">
          <button onClick={() => navigate('/organization/voice-agent')} className="btn-back-icon">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="call-header-title">
              <Sparkles className="text-brand-500" size={24} />
              {callLog.campaign.name}
            </h1>
            <p className="call-header-subtitle">
              <span className={`badge badge-${callLog.status === 'IN_PROGRESS' ? 'success' : 'neutral'}`} style={{ marginRight: '0.5rem' }}>
                {callLog.status.replace('_', ' ')}
              </span>
              Campaign Type: {callLog.campaign.type}
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="sound-wave-status">
           {isListening && <span className="status-text-listening">Listening...</span>}
           {isAISpeaking && <span className="status-text-speaking">AI is speaking...</span>}
           <div className="wave-bars">
             {[1, 2, 3, 4, 5].map(i => (
               <div key={i} className="wave-bar" style={{
                 background: isListening ? 'var(--danger)' : (isAISpeaking ? 'var(--brand-500)' : 'var(--text-muted)'),
                 height: (isListening || isAISpeaking) ? `${Math.random() * 20 + 4}px` : '4px'
               }} />
             ))}
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="call-chat-card">
        <div className="chat-mesh-bg" />

        <div className="chat-scroll-area" ref={scrollRef}>
          
          <div className="secure-badge-wrapper">
             <div className="secure-badge">
               Secure AI Voice Channel Established
             </div>
          </div>

          {callLog.transcripts.length === 0 && (
            <div className="empty-chat">
              <div className="empty-chat-icon"><Mic size={40} /></div>
              <p>No messages yet. Tap the microphone below to begin.</p>
            </div>
          )}
          
          {callLog.transcripts.map((msg) => (
            <div key={msg.id} className={`chat-msg-row ${msg.role === 'USER' ? 'user' : 'ai'}`}>
              <div className={`chat-avatar ${msg.role === 'USER' ? 'user' : 'ai'}`}>
                {msg.role === 'USER' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`chat-bubble ${msg.role === 'USER' ? 'user' : 'ai'}`}>
                {msg.message}
              </div>
            </div>
          ))}

          {isAISpeaking && (
            <div className="chat-msg-row ai">
              <div className="chat-avatar ai"><Bot size={20} /></div>
              <div className="chat-bubble ai">
                 <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="call-controls-overlay">
          <button 
            className="btn-end-call"
            onClick={() => { window.speechSynthesis.cancel(); navigate('/organization/voice-agent'); }}
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>

          <button 
            className={`btn-mic-toggle ${isListening ? 'listening' : 'idle'}`}
            onClick={toggleMic}
            title={isListening ? 'Tap to Stop' : 'Tap to Speak'}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          
          <div style={{ width: '60px' }}></div>
        </div>
      </div>
    </div>
  );
}
