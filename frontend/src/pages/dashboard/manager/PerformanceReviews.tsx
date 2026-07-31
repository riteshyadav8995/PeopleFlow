import React, { useState } from 'react';
import { Target, Search, FileText, CheckCircle, Clock, AlertCircle, Star, X } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import './PerformanceReviews.css';

export function PerformanceReviews() {
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

  const [reviews, setReviews] = useState(() => {
    const members = teamMembers || [];
    return members.length > 0
      ? members.map((m: any, i: number) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          role: m.designation?.title || 'Employee',
          status: i === 0 ? 'self_review_pending' : i === 1 ? 'manager_review' : 'completed',
          dueDate: '2026-08-15',
          score: i >= 2 ? 4.5 : null,
          feedback: ''
        }))
      : [
          { id: '1', name: 'Team Member 1', role: 'Developer', status: 'self_review_pending', dueDate: '2026-08-15', score: null, feedback: '' },
          { id: '2', name: 'Team Member 2', role: 'Designer', status: 'manager_review', dueDate: '2026-08-10', score: null, feedback: '' },
        ];
  });

  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const submitReview = () => {
    if (!reviewModal || reviewScore === 0) return;
    setReviews(prev => prev.map(r =>
      r.id === reviewModal.id ? { ...r, status: 'completed', score: reviewScore, feedback: reviewFeedback } : r
    ));
    setReviewModal(null);
    setReviewScore(0);
    setReviewFeedback('');
    showSuccess('Review submitted successfully!');
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'self_review_pending': return 'Self Review Pending';
      case 'manager_review': return 'Awaiting Your Review';
      case 'completed': return 'Completed';
      default: return s;
    }
  };

  const getStatusClass = (s: string) => {
    switch (s) {
      case 'self_review_pending': return 'pr-status-pending';
      case 'manager_review': return 'pr-status-review';
      case 'completed': return 'pr-status-completed';
      default: return '';
    }
  };

  return (
    <div className="perf-reviews-container">
      {successMsg && <div className="tg-success-toast">{successMsg}</div>}

      <div className="pr-header">
        <div>
          <h1 className="pr-title"><Target size={22} /> Performance Reviews</h1>
          <p className="pr-subtitle">Q3 2026 Appraisal Cycle — Review your team members' performance.</p>
        </div>
      </div>

      <div className="pr-stats-row">
        <div className="pr-stat-card">
          <div className="pr-stat-value">{reviews.filter(r => r.status === 'completed').length}</div>
          <div className="pr-stat-label">Completed</div>
        </div>
        <div className="pr-stat-card pr-stat-warning">
          <div className="pr-stat-value">{reviews.filter(r => r.status === 'manager_review').length}</div>
          <div className="pr-stat-label">Awaiting Review</div>
        </div>
        <div className="pr-stat-card">
          <div className="pr-stat-value">{reviews.filter(r => r.status === 'self_review_pending').length}</div>
          <div className="pr-stat-label">Pending Self-Review</div>
        </div>
      </div>

      <div className="pr-list">
        {reviews.map(review => (
          <div key={review.id} className="pr-card">
            <div className="pr-card-left">
              <div className="pr-avatar">{review.name.charAt(0)}</div>
              <div>
                <h3 className="pr-card-name">{review.name}</h3>
                <p className="pr-card-role">{review.role}</p>
              </div>
            </div>
            <div className="pr-card-center">
              <span className={`pr-status-badge ${getStatusClass(review.status)}`}>
                {review.status === 'completed' ? <CheckCircle size={12} /> : review.status === 'manager_review' ? <AlertCircle size={12} /> : <Clock size={12} />}
                {getStatusLabel(review.status)}
              </span>
              <span className="pr-due">Due: {review.dueDate}</span>
            </div>
            <div className="pr-card-right">
              {review.score ? (
                <div className="pr-score">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" /> {review.score}/5
                </div>
              ) : review.status === 'manager_review' ? (
                <button className="pr-review-btn" onClick={() => { setReviewModal(review); setReviewScore(0); setReviewFeedback(''); }}>
                  Submit Review
                </button>
              ) : (
                <span className="pr-waiting">Waiting...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="tg-modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h2>Review: {reviewModal.name}</h2>
              <button className="tg-modal-close" onClick={() => setReviewModal(null)}><X size={18} /></button>
            </div>
            <div className="tg-modal-body">
              <label className="tg-label">Rating (1-5) *</label>
              <div className="pr-star-picker">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={28} className={`pr-star ${reviewScore >= s ? 'pr-star-active' : ''}`}
                    fill={reviewScore >= s ? '#f59e0b' : 'none'} color={reviewScore >= s ? '#f59e0b' : '#d1d5db'}
                    onClick={() => setReviewScore(s)} style={{ cursor: 'pointer' }} />
                ))}
              </div>

              <label className="tg-label">Feedback</label>
              <textarea className="tg-input" rows={4} placeholder="Write your feedback..."
                value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div className="tg-modal-footer">
              <button className="tg-btn-cancel" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="tg-btn-submit" onClick={submitReview} disabled={reviewScore === 0}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
