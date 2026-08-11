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
  configurations?: Array<{ systemPrompt: string, voiceSettings?: any }>;
}

interface CallLog {
  id: string;
  status: string;
  createdAt: string;
  campaign: { name: string };
  candidate?: { firstName: string, lastName: string, email: string, phone: string };
  employee?: { firstName: string, lastName: string, email: string, phone: string };
}

export function VoiceAgentDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testModal, setTestModal] = useState<{isOpen: boolean, campaignId: string | null}>({ isOpen: false, campaignId: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
    fetchCallLogs();
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

  const fetchCallLogs = async () => {
    try {
      const res = await api.get('/voice-agent/calls');
      setCallLogs(res.data.data || []);
    } catch (error) {
      console.error('Error fetching call logs', error);
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

  const executeTestCall = async (campaignId: string, phoneNumber: string) => {
    try {
      await api.post('/voice-agent/calls', { 
        campaignId, 
        phoneNumber: phoneNumber.trim()
      });
      alert('Call initiated successfully! Your phone should ring shortly.');
    } catch (error) {
      console.error('Failed to start call', error);
      alert('Failed to start call');
    }
  };

  const editCampaign = async (campaign: Campaign) => {
    const newName = prompt('Edit Campaign Name:', campaign.name);
    if (newName === null) return;
    
    const currentPrompt = campaign.configurations && campaign.configurations.length > 0 
      ? campaign.configurations[0].systemPrompt 
      : 'You are a helpful AI HR assistant.';
    
    const newPrompt = prompt('Edit AI System Prompt:', currentPrompt);
    if (newPrompt === null) return;

    try {
      await api.put(`/voice-agent/campaigns/${campaign.id}`, {
        name: newName,
        systemPrompt: newPrompt,
        type: campaign.type
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to update campaign', error);
      alert('Failed to update campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.delete(`/voice-agent/campaigns/${campaignId}`);
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign', error);
      alert('Failed to delete campaign');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        Loading Voice AI...
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
      <div className="voice-stats-compact">
        <div className="voice-stat-card-compact brand">
          <Sparkles size={16} className="voice-stat-icon-compact brand" />
          <span className="voice-stat-label-compact">Active Campaigns:</span>
          <span className="voice-stat-value-compact">{campaigns.length}</span>
        </div>
        <div className="voice-stat-card-compact success">
          <PhoneCall size={16} className="voice-stat-icon-compact success" />
          <span className="voice-stat-label-compact">Total Automated Calls:</span>
          <span className="voice-stat-value-compact">{totalCalls}</span>
        </div>
        <div className="voice-stat-card-compact warning">
          <Clock size={16} className="voice-stat-icon-compact warning" />
          <span className="voice-stat-label-compact">Hours Saved:</span>
          <span className="voice-stat-value-compact">{Math.round(totalCalls * 0.25)}h</span>
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

            <div className="campaign-actions" style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => editCampaign(campaign)} style={{ flex: 1, justifyContent: 'center', padding: '0.4rem 0.5rem', fontSize: '0.85rem', borderRadius: '1.5rem' }}>
                 Edit
              </Button>
              <Button variant="danger" onClick={() => deleteCampaign(campaign.id)} style={{ flex: 1, justifyContent: 'center', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.5rem', fontSize: '0.85rem', borderRadius: '1.5rem' }}>
                 Delete
              </Button>
              <Button variant="primary" className="btn-test-call" onClick={() => {
                const phone = prompt('Enter mobile number with country code (e.g. +919876543210):');
                if (phone) executeTestCall(campaign.id, phone);
              }} style={{ flex: 1.5, justifyContent: 'center', padding: '0.4rem 0.5rem', fontSize: '0.85rem', borderRadius: '1.5rem' }}>
                <Mic size={14} style={{ marginRight: '0.25rem' }} /> Test Call
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

      {/* Call History Section */}
      <div className="call-history-section">
        <h3 className="campaigns-section-title" style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
          Call History
        </h3>
        <div className="call-history-table-container">
          <table className="call-history-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Email ID</th>
                <th>Mobile No</th>
                <th>Call Initiated</th>
                <th>Received</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.map((log) => {
                const name = log.candidate ? `${log.candidate.firstName} ${log.candidate.lastName}` : (log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : 'Unknown');
                const email = log.candidate?.email || log.employee?.email || 'N/A';
                const phone = log.candidate?.phone || log.employee?.phone || 'N/A';
                const callInitiated = 'Yes';
                const received = (log.status === 'COMPLETED' || log.status === 'ANSWERED' || log.status === 'IN_PROGRESS') ? 'Yes' : 'No';

                return (
                  <tr key={log.id}>
                    <td>{name}</td>
                    <td>{email}</td>
                    <td>{phone}</td>
                    <td>
                      <span className="status-badge success">{callInitiated}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${received === 'Yes' ? 'success' : 'danger'}`}>
                        {received}
                      </span>
                    </td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No calls made yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
