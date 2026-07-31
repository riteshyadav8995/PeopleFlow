import React, { useState } from 'react';
import { Search, Star, MessageSquare, CheckCircle, Clock, Calendar, Briefcase, X } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { recruitmentService } from '../../../services/recruitment.service';
import './CandidateFeedback.css';

export function CandidateFeedback() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  // Fetch real interviews
  const { data: rawInterviews, isLoading } = useQuery({
    queryKey: ['candidateFeedback', organizationId],
    queryFn: () => recruitmentService.getInterviews(organizationId),
    enabled: !!organizationId
  });

  const interviews = (rawInterviews || []).map((i: any) => ({
    id: i.id,
    name: `${i.candidate?.firstName || 'Unknown'} ${i.candidate?.lastName || ''}`,
    role: i.application?.job?.jobTitle || i.roundName || 'Position',
    date: new Date(i.scheduledAt).toLocaleDateString(),
    status: i.status === 'COMPLETED' ? 'completed' : 'pending_feedback',
    rating: 0,
  }));

  const allCandidates = interviews;
  const [displayCandidates, setDisplayCandidates] = useState(allCandidates);

  // Update when interviews load
  React.useEffect(() => {
    if (interviews && interviews.length > 0) setDisplayCandidates(interviews);
  }, [rawInterviews]);

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [feedbackModal, setFeedbackModal] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const submitFeedback = () => {
    if (!feedbackModal || rating === 0) return;
    setDisplayCandidates(prev => prev.map((c: any) =>
      c.id === feedbackModal.id ? { ...c, status: 'completed', rating } : c
    ));
    setFeedbackModal(null);
    setRating(0);
    setFeedback('');
    showSuccess('Feedback submitted!');
  };

  const pendingList = displayCandidates.filter((c: any) => c.status === 'pending_feedback');
  const completedList = displayCandidates.filter((c: any) => c.status === 'completed');
  const displayed = activeTab === 'pending' ? pendingList : completedList;

  return (
    <div className="cf-container">
      {successMsg && <div className="tg-success-toast">{successMsg}</div>}

      <div className="oon-header">
        <div>
          <h1 className="oon-title"><MessageSquare size={22} /> Candidate Feedback</h1>
          <p className="oon-subtitle">Submit interview feedback for candidates you've interviewed.</p>
        </div>
      </div>

      <div className="oon-tabs">
        <button className={`oon-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <Clock size={14} /> Pending ({pendingList.length})
        </button>
        <button className={`oon-tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
          <CheckCircle size={14} /> Completed ({completedList.length})
        </button>
      </div>

      <div className="oon-list">
        {displayed.length === 0 && (
          <div className="goals-empty"><MessageSquare size={40} strokeWidth={1} /><p>No {activeTab} feedback.</p></div>
        )}
        {displayed.map((c: any) => (
          <div key={c.id} className="cf-card">
            <div className="cf-card-left">
              <div className="pr-avatar">{c.name.charAt(0)}</div>
              <div>
                <h3 className="oon-card-name">{c.name}</h3>
                <p className="oon-card-type">{c.role}</p>
              </div>
            </div>
            <div className="cf-card-center">
              <span className="oon-card-date"><Calendar size={12} /> {c.date}</span>
            </div>
            <div className="cf-card-right">
              {c.status === 'pending_feedback' ? (
                <button className="pr-review-btn" onClick={() => { setFeedbackModal(c); setRating(0); setFeedback(''); }}>
                  Give Feedback
                </button>
              ) : (
                <div className="pr-score">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" /> {c.rating}/5
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {feedbackModal && (
        <div className="tg-modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h2>Feedback: {feedbackModal.name}</h2>
              <button className="tg-modal-close" onClick={() => setFeedbackModal(null)}><X size={18} /></button>
            </div>
            <div className="tg-modal-body">
              <label className="tg-label">Rating (1-5) *</label>
              <div className="pr-star-picker">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={28} fill={rating >= s ? '#f59e0b' : 'none'} color={rating >= s ? '#f59e0b' : '#d1d5db'}
                    onClick={() => setRating(s)} style={{ cursor: 'pointer' }} />
                ))}
              </div>
              <label className="tg-label">Comments</label>
              <textarea className="tg-input" rows={4} placeholder="Write your feedback..." value={feedback} onChange={e => setFeedback(e.target.value)} style={{resize:'vertical'}} />
            </div>
            <div className="tg-modal-footer">
              <button className="tg-btn-cancel" onClick={() => setFeedbackModal(null)}>Cancel</button>
              <button className="tg-btn-submit" onClick={submitFeedback} disabled={rating === 0}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
