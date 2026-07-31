import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Video, CheckCircle, User } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { recruitmentService } from '../../../services/recruitment.service';
import './InterviewSchedule.css';

export function InterviewSchedule() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['managerInterviews', organizationId],
    queryFn: () => recruitmentService.getInterviews(organizationId),
    enabled: !!organizationId
  });

  const allInterviews = interviews || [];

  const upcoming = allInterviews.filter((i: any) => ['SCHEDULED', 'CONFIRMED'].includes(i.status));
  const completed = allInterviews.filter((i: any) => i.status === 'COMPLETED');
  const displayed = activeTab === 'upcoming' ? upcoming : completed;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="is-container">
      <div className="oon-header">
        <div>
          <h1 className="oon-title"><CalendarIcon size={22} /> Interview Schedule</h1>
          <p className="oon-subtitle">View upcoming and past interviews assigned to you.</p>
        </div>
      </div>

      <div className="oon-tabs">
        <button className={`oon-tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          <CalendarIcon size={14} /> Upcoming ({upcoming.length})
        </button>
        <button className={`oon-tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
          <CheckCircle size={14} /> Completed ({completed.length})
        </button>
      </div>

      <div className="oon-list">
        {isLoading && <div style={{textAlign:'center',padding:'2rem',color:'#9ca3af'}}>Loading...</div>}
        {!isLoading && displayed.length === 0 && (
          <div className="goals-empty"><CalendarIcon size={40} strokeWidth={1} /><p>No {activeTab} interviews.</p></div>
        )}
        {displayed.map((interview: any) => (
          <div key={interview.id} className="is-card">
            <div className="is-card-header">
              <div className="ta-card-info">
                <div className="pr-avatar">{(interview.candidate?.firstName || 'C').charAt(0)}</div>
                <div>
                  <h3 className="oon-card-name">{interview.candidate?.firstName} {interview.candidate?.lastName}</h3>
                  <p className="oon-card-type">{interview.application?.job?.jobTitle || interview.roundName}</p>
                </div>
              </div>
              <span className={`pr-status-badge ${interview.status === 'COMPLETED' ? 'pr-status-completed' : 'pr-status-review'}`}>
                {interview.status}
              </span>
            </div>
            <div className="is-card-details">
              <span className="is-detail"><CalendarIcon size={12} /> {formatDate(interview.scheduledAt)}</span>
              <span className="is-detail"><Clock size={12} /> {formatTime(interview.scheduledAt)}</span>
              <span className="is-detail"><User size={12} /> {interview.roundName}</span>
              <span className="is-detail"><Video size={12} /> {interview.interviewMode}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
