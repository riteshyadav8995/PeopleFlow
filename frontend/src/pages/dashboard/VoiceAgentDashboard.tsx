import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Plus, PhoneCall, History, Sparkles, Activity, Clock, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import './VoiceAgentDashboard.css';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  _count?: { callLogs: number };
  createdAt: string;
}

export function VoiceAgentDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/voice-agent/campaigns');
      setCampaigns(res.data.data || []);
    } catch (error) {
      console.error('Error fetching campaigns', error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createCampaign = async () => {
    const name = prompt('Campaign Name (e.g. Q3 Hiring Screen):');
    if (!name) return;
    const systemPrompt = prompt('AI System Prompt (e.g. "You are an HR recruiter..."):');
    if (!systemPrompt) return;

    try {
      await api.post('/voice-agent/campaigns', {
        name,
        systemPrompt,
        type: 'SCREENING'
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to create campaign', error);
      alert('Failed to create campaign');
    }
  };

  const startTestCall = async (campaignId: string, phoneNumber?: string) => {
    try {
      const res = await api.post('/voice-agent/calls', { campaignId, phoneNumber });
      
      if (!phoneNumber) {
        // If testing in browser, route to browser interface
        navigate(`/organization/voice-agent/${res.data.data.id}`);
      } else {
        alert('Call initiated successfully via Vapi!');
      }
    } catch (error) {
      console.error('Failed to start call', error);
      alert('Failed to start call');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Activity className="animate-spin text-brand-500" style={{ marginRight: '0.5rem' }} /> Loading Voice AI...
      </div>
    );
  }

  const totalCalls = campaigns.reduce((acc, curr) => acc + (curr._count?.callLogs || 0), 0);

  return (
    <div className="voice-dashboard-container page-container">
      
      {/* Hero Section */}
      <div className="voice-hero">
        <div>
          <h1 className="voice-title">
            <span className="voice-title-icon"><Mic size={32} /></span>
            Voice AI Intelligence
          </h1>
          <p className="voice-subtitle">
            Automate phone screenings, onboarding check-ins, and HR follow-ups with ultra-low latency conversational AI.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={createCampaign} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '2rem' }}>
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="voice-stats">
         <div className="voice-stat-card brand">
            <div className="voice-stat-icon brand"><Sparkles size={28} /></div>
            <div>
               <p className="voice-stat-label">Active Campaigns</p>
               <h2 className="voice-stat-value">{campaigns.length}</h2>
            </div>
         </div>
         <div className="voice-stat-card success">
            <div className="voice-stat-icon success"><PhoneCall size={28} /></div>
            <div>
               <p className="voice-stat-label">Total Automated Calls</p>
               <h2 className="voice-stat-value">{totalCalls}</h2>
            </div>
         </div>
         <div className="voice-stat-card warning">
            <div className="voice-stat-icon warning"><Clock size={28} /></div>
            <div>
               <p className="voice-stat-label">Hours Saved</p>
               <h2 className="voice-stat-value">{Math.round(totalCalls * 0.25)}h</h2>
            </div>
         </div>
      </div>

      {/* Campaigns Grid */}
      <h3 className="campaigns-section-title">Active Campaigns</h3>
      <div className="campaigns-grid">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-card">
            <div className="campaign-card-header">
              <div className="campaign-header-info">
                <div className="campaign-icon-wrapper"><PhoneCall size={24} /></div>
                <div>
                  <h3 className="campaign-name">{campaign.name}</h3>
                  <span className="campaign-type">{campaign.type}</span>
                </div>
              </div>
              <span className={`badge badge-${campaign.status === 'ACTIVE' ? 'success' : 'neutral'}`}>
                {campaign.status}
              </span>
            </div>

            <div className="campaign-stats-box">
               <div className="campaign-stat-item">
                  <span className="campaign-stat-label">Interactions</span>
                  <span className="campaign-stat-value">
                    <Users size={16} className="text-brand-500" /> {campaign._count?.callLogs || 0}
                  </span>
               </div>
               <div className="campaign-divider"></div>
               <div className="campaign-stat-item">
                  <span className="campaign-stat-label">Created</span>
                  <span className="campaign-stat-date">{new Date(campaign.createdAt).toLocaleDateString()}</span>
               </div>
            </div>

            <div className="campaign-actions">
              {/* <Button variant="secondary" onClick={() => navigate(`/voice-agent/campaigns/${campaign.id}/logs`)} style={{ flex: 1, justifyContent: 'center' }}>
                <History size={16} style={{ marginRight: '0.5rem' }} /> Logs
              </Button> */}
              <Button variant="primary" className="btn-test-call" onClick={() => startTestCall(campaign.id)} style={{ flex: 1, justifyContent: 'center' }}>
                <Mic size={16} style={{ marginRight: '0.5rem' }} /> Test Call
              </Button>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="empty-campaigns">
            <div className="empty-icon-wrapper"><Mic size={48} /></div>
            <h3 className="empty-title">No AI Campaigns Active</h3>
            <p className="empty-subtitle">Create a voice campaign to automate your HR screening or employee check-ins using our conversational engine.</p>
            <Button variant="primary" leftIcon={<Plus size={18} />} onClick={createCampaign}>
               Create First Campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
