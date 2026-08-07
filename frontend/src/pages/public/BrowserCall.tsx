import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Mic, MicOff, PhoneOff, Bot, Activity } from 'lucide-react';
import './BrowserCall.css';

// Public API client
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
});

export function BrowserCall() {
  const { id } = useParams<{ id: string }>();
  const [callInfo, setCallInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    fetchCallInfo();
    initSpeech();
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [id]);

  const fetchCallInfo = async () => {
    try {
      const res = await publicApi.get(`/voice-agent/public/calls/${id}`);
      setCallInfo(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load call session. It may have expired or ended.');
    } finally {
      setLoading(false);
    }
  };

  const initSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Your browser does not support Web Speech API. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      handleUserSpeak(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;
  };

  const handleUserSpeak = async (text: string) => {
    setTranscript(prev => [...prev, { role: 'user', text }]);
    
    try {
      setIsSpeaking(true);
      const res = await publicApi.post(`/voice-agent/public/calls/${id}/interact`, { message: text });
      const aiResponse = res.data.data.response;
      
      setTranscript(prev => [...prev, { role: 'ai', text: aiResponse }]);
      
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(aiResponse);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => {
           setIsSpeaking(false);
           // Optionally auto-restart listening here if we want continuous
        };
        synthRef.current.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error('Failed to get AI response', err);
      setIsSpeaking(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (synthRef.current?.speaking) {
         synthRef.current.cancel(); // Stop AI if speaking
         setIsSpeaking(false);
      }
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        // Already started
      }
    }
  };

  const endCall = async () => {
    if (!window.confirm('Are you sure you want to end this call?')) return;
    try {
      await publicApi.post(`/voice-agent/public/calls/${id}/end`);
      setCallInfo((prev: any) => ({ ...prev, status: 'COMPLETED' }));
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
      alert('Call ended successfully. Thank you!');
    } catch (err) {
      alert('Failed to end call properly.');
    }
  };

  if (loading) return <div className="call-container centered"><Activity className="animate-spin text-brand" size={32} /></div>;
  if (error) return <div className="call-container centered"><p className="error-text">{error}</p></div>;
  if (!callInfo) return null;

  const isCompleted = callInfo.status !== 'IN_PROGRESS';

  return (
    <div className="call-container">
      <div className="call-card">
        <div className="call-header">
          <h2>AI Interview: {callInfo.campaign?.name}</h2>
          <span className={`status-badge ${isCompleted ? 'ended' : 'active'}`}>
            {callInfo.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="call-body">
          {isCompleted ? (
            <div className="completed-state">
              <Activity size={48} className="text-gray" style={{ margin: '0 auto' }} />
              <h3>This call has ended</h3>
              <p>Thank you for participating.</p>
            </div>
          ) : (
            <div className="active-state">
              <div className="ai-avatar-container">
                <div className={`ai-avatar ${isSpeaking ? 'speaking-pulse' : ''}`}>
                  <Bot size={48} />
                </div>
                <p className="ai-status-text">
                  {isSpeaking ? 'AI is speaking...' : isListening ? 'AI is listening...' : 'AI is waiting'}
                </p>
              </div>

              <div className="transcript-preview">
                {transcript.length === 0 ? (
                  <p className="text-gray text-center">Tap the microphone and say hello to begin.</p>
                ) : (
                  <div className="latest-message">
                    <strong>{transcript[transcript.length - 1].role === 'user' ? 'You' : 'AI'}: </strong>
                    <span>{transcript[transcript.length - 1].text}</span>
                  </div>
                )}
              </div>

              <div className="call-controls">
                <button 
                  className={`btn-mic ${isListening ? 'listening' : ''}`}
                  onClick={toggleListen}
                  title={isListening ? 'Stop Listening' : 'Start Speaking'}
                >
                  {isListening ? <Mic size={28} /> : <MicOff size={28} />}
                </button>
                <button className="btn-end" onClick={endCall} title="End Call">
                  <PhoneOff size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
