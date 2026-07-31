import React, { useState } from 'react';
import { Users, Plus, Calendar as CalendarIcon, Clock, Video, CheckCircle, X } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { performanceService } from '../../../services/performance.service';
import './OneOnOneMeetings.css';

export function OneOnOneMeetings() {
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

  const { data: realMeetings, isLoading: loadingMeetings } = useQuery({
    queryKey: ['teamMeetings'],
    queryFn: () => performanceService.getTeamMeetings()
  });

  const meetings = realMeetings ? realMeetings.map((m: any) => ({
    id: m.id,
    employee: m.attendees && m.attendees.length > 0 ? 'Team Member' : 'Team Member', // Attendees list would ideally map to names
    date: m.startTime.split('T')[0],
    time: new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: m.status.toLowerCase(),
    type: m.title
  })) : [];

  const createMeetingMutation = useMutation({
    mutationFn: (data: any) => performanceService.createMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMeetings'] });
      setNewMeeting({ employee: '', date: '', time: '10:00', type: 'Weekly Sync' });
      setShowModal(false);
      showSuccess('Meeting scheduled!');
    }
  });

  const completeMeetingMutation = useMutation({
    mutationFn: (id: string) => performanceService.completeMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMeetings'] });
      showSuccess('Meeting completed');
    }
  });

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ employee: '', date: '', time: '10:00', type: 'Weekly Sync' });
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSchedule = () => {
    if (!newMeeting.employee || !newMeeting.date) return;
    createMeetingMutation.mutate({
      employeeId: newMeeting.employee,
      date: newMeeting.date,
      time: newMeeting.time,
      type: newMeeting.type
    });
  };

  const markComplete = (id: string) => {
    completeMeetingMutation.mutate(id);
  };

  const cancelMeeting = (id: string) => {
    showSuccess('Meeting cancelled (UI mock).');
  };

  const teamNames = teamMembers?.map((m: any) => `${m.firstName} ${m.lastName}`) || [];
  const filtered = meetings.filter((m: any) => activeTab === 'upcoming' ? m.status === 'upcoming' : m.status === 'completed');

  return (
    <div className="oon-container">
      {successMsg && <div className="tg-success-toast">{successMsg}</div>}

      <div className="oon-header">
        <div>
          <h1 className="oon-title"><Users size={22} /> 1-on-1 Meetings</h1>
          <p className="oon-subtitle">Schedule and track one-on-one meetings with your direct reports.</p>
        </div>
        <button className="goals-add-btn" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      <div className="oon-tabs">
        <button className={`oon-tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          <CalendarIcon size={14} /> Upcoming ({meetings.filter((m: any) => m.status === 'upcoming').length})
        </button>
        <button className={`oon-tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
          <CheckCircle size={14} /> Past ({meetings.filter((m: any) => m.status === 'completed').length})
        </button>
      </div>

      <div className="oon-list">
        {filtered.length === 0 && (
          <div className="goals-empty"><CalendarIcon size={40} strokeWidth={1} /><p>No {activeTab} meetings.</p></div>
        )}
        {filtered.map((m: any) => (
          <div key={m.id} className="oon-card">
            <div className="oon-card-left">
              <div className="pr-avatar">{m.employee.charAt(0)}</div>
              <div>
                <h3 className="oon-card-name">{m.employee}</h3>
                <p className="oon-card-type">{m.type}</p>
              </div>
            </div>
            <div className="oon-card-center">
              <span className="oon-card-date"><CalendarIcon size={12} /> {m.date}</span>
              <span className="oon-card-time"><Clock size={12} /> {m.time}</span>
            </div>
            <div className="oon-card-right">
              {m.status === 'upcoming' ? (
                <>
                  <button className="pr-review-btn" onClick={() => markComplete(m.id)}>Complete</button>
                  <button className="goal-action-btn goal-action-danger" onClick={() => cancelMeeting(m.id)}>Cancel</button>
                </>
              ) : (
                <span className="pr-status-badge pr-status-completed"><CheckCircle size={12} /> Done</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="tg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h2>Schedule 1-on-1</h2>
              <button className="tg-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="tg-modal-body">
              <label className="tg-label">Team Member *</label>
              <select className="tg-input" value={newMeeting.employee} onChange={e => setNewMeeting({...newMeeting, employee: e.target.value})}>
                <option value="">Select...</option>
                {teamNames.map((n: string) => <option key={n} value={n}>{n}</option>)}
              </select>
              <label className="tg-label">Date *</label>
              <input className="tg-input" type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
              <label className="tg-label">Time</label>
              <input className="tg-input" type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} />
              <label className="tg-label">Type</label>
              <select className="tg-input" value={newMeeting.type} onChange={e => setNewMeeting({...newMeeting, type: e.target.value})}>
                <option>Weekly Sync</option>
                <option>Career Growth</option>
                <option>Monthly Check-in</option>
                <option>Performance Discussion</option>
              </select>
            </div>
            <div className="tg-modal-footer">
              <button className="tg-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="tg-btn-submit" onClick={handleSchedule} disabled={!newMeeting.employee || !newMeeting.date}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
