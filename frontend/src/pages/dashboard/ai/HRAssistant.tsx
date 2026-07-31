import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import axios from 'axios';

export function HRAssistant() {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am your AI HR Assistant. I can help you with company policies, leave balances, tax structures, and more. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // In development, this points to our backend API
      const response = await axios.post('/api/v1/ai/chat', { message: userMessage });
      
      setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am currently experiencing connection issues. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>AI HR Assistant</h1>
          <p style={{ color: '#64748b' }}>Get instant answers to your HR queries powered by Artificial Intelligence.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}>
          <Bot size={16} /> Online
        </div>
      </div>

      <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#f8fafc' }} className="custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '1rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: msg.role === 'user' ? '#3b82f6' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{ background: msg.role === 'user' ? '#3b82f6' : '#fff', color: msg.role === 'user' ? '#fff' : '#1e293b', padding: '1rem 1.25rem', borderRadius: '12px', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0', maxWidth: '75%', fontSize: '0.9375rem', lineHeight: 1.5, boxShadow: msg.role === 'user' ? '0 2px 4px rgba(59,130,246,0.3)' : '0 1px 2px rgba(0,0,0,0.05)' }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <Bot size={20} />
              </div>
              <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                <Loader2 size={18} className="animate-spin" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Ask me about leaves, salary structure, or company policies..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '9999px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9375rem', background: '#f8fafc' }}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{ width: '52px', height: '52px', borderRadius: '50%', background: !input.trim() || isLoading ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <Send size={20} style={{ transform: 'translateX(-1px)' }} />
            </button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
            <Info size={14} /> AI answers are based on the latest company HR handbook.
          </div>
        </div>

      </div>
    </div>
  );
}
