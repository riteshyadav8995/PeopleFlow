import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, TrendingUp, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { performanceService } from '../../../services/performance.service';
import './TeamFeedback.css';

export function TeamFeedback() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  const { data: teamMembers } = useQuery({
    queryKey: ['myTeam', organizationId, user?.employeeId],
    queryFn: async () => {
      const res = await api.get('/employee', { params: { organizationId, managerId: user?.employeeId } });
      return res.data.data || [];
    },
    enabled: !!organizationId && !!user?.employeeId
  });

  const queryClient = useQueryClient();

  const { data: realFeedbacks, isLoading: loadingFeedbacks } = useQuery({
    queryKey: ['teamFeedback'],
    queryFn: () => performanceService.getTeamFeedback()
  });

  const feedbacks = realFeedbacks ? realFeedbacks.map((f: any) => ({
    id: f.id,
    recipient: f.employee ? `${f.employee.firstName} ${f.employee.lastName}` : 'Unknown',
    type: f.rating === 5 ? 'praise' : 'constructive',
    message: f.content,
    date: f.date.split('T')[0],
    author: f.reviewer ? `${f.reviewer.firstName} ${f.reviewer.lastName}` : 'Me'
  })) : [];

  const createFeedbackMutation = useMutation({
    mutationFn: (data: any) => performanceService.createFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamFeedback'] });
      setNewFeedback({ recipient: '', type: 'praise', message: '' });
      setShowModal(false);
      showSuccess('Feedback submitted!');
    }
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: (id: string) => performanceService.deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamFeedback'] });
      showSuccess('Feedback deleted');
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'praise' | 'constructive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ recipient: '', type: 'praise', message: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSubmit = () => {
    if (!newFeedback.recipient || !newFeedback.message) return;
    createFeedbackMutation.mutate({
      employeeId: newFeedback.recipient,
      type: newFeedback.type,
      message: newFeedback.message
    });
  };

  const deleteFeedback = (id: string) => {
    deleteFeedbackMutation.mutate(id);
  };

  const teamNames = teamMembers?.map((m: any) => `${m.firstName} ${m.lastName}`) || [];
  const filtered = feedbacks.filter((f: any) => activeTab === 'all' || f.type === activeTab);

  return (
    <div className="tf-container">
      {successMsg && <div className="tg-success-toast">{successMsg}</div>}

      <div className="oon-header">
        <div>
          <h1 className="oon-title"><MessageSquare size={22} /> Team Feedback</h1>
          <p className="oon-subtitle">Give praise and constructive feedback to your team members.</p>
        </div>
        <button className="goals-add-btn" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Give Feedback
        </button>
      </div>

      <div className="oon-tabs">
        {(['all', 'praise', 'constructive'] as const).map(tab => (
          <button key={tab} className={`oon-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'praise' ? <ThumbsUp size={14} /> : tab === 'constructive' ? <TrendingUp size={14} /> : <MessageSquare size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({feedbacks.filter((f: any) => tab === 'all' || f.type === tab).length})
          </button>
        ))}
      </div>

      <div className="oon-list">
        {filtered.length === 0 && (
          <div className="goals-empty"><MessageSquare size={40} strokeWidth={1} /><p>No feedback yet.</p></div>
        )}
        {filtered.map((f: any) => (
          <div key={f.id} className={`tf-card tf-card-${f.type}`}>
            <div className="tf-card-top">
              <div className="tf-card-header">
                <span className={`tf-type-badge tf-type-${f.type}`}>
                  {f.type === 'praise' ? <ThumbsUp size={12} /> : <TrendingUp size={12} />}
                  {f.type}
                </span>
                <span className="tf-card-date">{f.date}</span>
              </div>
              <button className="goal-action-btn goal-action-danger" onClick={() => deleteFeedback(f.id)} style={{fontSize: '0.625rem', padding: '0.125rem 0.5rem'}}>✕</button>
            </div>
            <h3 className="tf-card-recipient">To: {f.recipient}</h3>
            <p className="tf-card-message">{f.message}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="tg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h2>Give Feedback</h2>
              <button className="tg-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="tg-modal-body">
              <label className="tg-label">To *</label>
              <select className="tg-input" value={newFeedback.recipient} onChange={e => setNewFeedback({...newFeedback, recipient: e.target.value})}>
                <option value="">Select team member...</option>
                {teamNames.map((n: string) => <option key={n} value={n}>{n}</option>)}
              </select>
              <label className="tg-label">Type</label>
              <select className="tg-input" value={newFeedback.type} onChange={e => setNewFeedback({...newFeedback, type: e.target.value})}>
                <option value="praise">Praise</option>
                <option value="constructive">Constructive</option>
              </select>
              <label className="tg-label">Message *</label>
              <textarea className="tg-input" rows={4} placeholder="Write your feedback..." value={newFeedback.message} onChange={e => setNewFeedback({...newFeedback, message: e.target.value})} style={{resize:'vertical'}} />
            </div>
            <div className="tg-modal-footer">
              <button className="tg-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="tg-btn-submit" onClick={handleSubmit} disabled={!newFeedback.recipient || !newFeedback.message}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
