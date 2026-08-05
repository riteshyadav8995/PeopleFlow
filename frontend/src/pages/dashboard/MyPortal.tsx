import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { dashboardService } from '@/services/dashboard.service';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';

import { 
  Clock, Sun, Moon, Search, Calendar, FileText, User, Users, Clock3, GitMerge,
  ArrowRight, CheckCircle, FilePlus, Gift, Cake, UserPlus, FileSearch, ShieldCheck
} from 'lucide-react';

import './MyPortal.css';

export function MyPortal() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const orgId = user?.organizationId || '';
  const navigate = useNavigate();

  // Real-time clock for the header
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeEventTab, setActiveEventTab] = useState('Leave');

  // --- Data Fetching (Unified Dashboard API) ---
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['employeeDashboard', orgId],
    queryFn: () => dashboardService.getEmployeeDashboard(orgId),
    enabled: !!orgId
  });

  const clockInMutation = useMutation({
    mutationFn: () => api.post('/attendance/clock-in', { organizationId: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to clock in')
  });

  const clockOutMutation = useMutation({
    mutationFn: () => api.post('/attendance/clock-out', { organizationId: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to clock out')
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const { attendanceToday } = dashboardData || {};

  // Trust the backend's attendance record (which already filters for 'today')
  const currentAttendance = attendanceToday;

  const getLiveDuration = () => {
    if (!currentAttendance?.clockInTime) return null;
    if (currentAttendance.clockOutTime && currentAttendance.totalHours) {
      return `${Math.floor(currentAttendance.totalHours)}h ${Math.round((currentAttendance.totalHours % 1) * 60)}m`;
    }
    const diff = currentTime.getTime() - new Date(currentAttendance.clockInTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString: string | undefined) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="portal-container">
      
      {/* Top Section: Banner & Clock */}
      <div className="portal-top-grid">
        
        {/* Banner */}
        <div className="portal-banner">
          <div className="portal-banner-content">
            <h1 className="portal-banner-title">
              Rise and thrive, {user?.firstName} <span>✨</span>
            </h1>
            <p className="portal-banner-subtitle">Dive into new opportunities and create an impactful day!</p>
          </div>
          {/* Mock Illustration SVG */}
          <div className="portal-banner-img-container">
             <img src="https://illustrations.popsy.co/blue/freelancer.svg" alt="Illustration" className="portal-banner-img" />
          </div>
        </div>

        {/* Clock Widget */}
        <div className="clock-widget">
          <div className="clock-widget-title">Let's Get the Ball Rolling</div>
          
          <div className="clock-display">
            <div className="clock-date">
              {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'long' })}
            </div>
            <div className="clock-time">
              {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          
          <div className="shift-info">
            <div className="shift-details">
              Shift: 09:00 - 18:00
            </div>
            <a href="#" className="view-policies-link">View Policies</a>
          </div>
          
          {currentAttendance?.clockInTime ? (
            <>
              <div className="attendance-block">
                <div className="attendance-timeline">
                  <div className="timeline-track">
                    <div className="timeline-dot" />
                    <div className="timeline-line" />
                    <div className="timeline-dot" />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-item">
                      <span className="timeline-label">Clock In</span>
                      <span className="timeline-time">{formatTime(currentAttendance.clockInTime)}</span>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-label">Clock Out</span>
                      {currentAttendance.clockOutTime ? (
                        <span className="timeline-time">{formatTime(currentAttendance.clockOutTime)}</span>
                      ) : (
                        <span className="text-warning font-medium text-sm">Working...</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="work-duration mt-4 p-3 bg-brand-50 rounded-lg text-center" style={{ backgroundColor: 'var(--brand-50)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', textAlign: 'center' }}>
                  <span className="text-sm text-subtle block mb-1">Total Work Duration</span>
                  <span className="text-lg font-bold text-brand-600">
                    {getLiveDuration()}
                  </span>
                </div>
              </div>
              
              {currentAttendance.clockOutTime ? (
                <>
                  <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', textAlign: 'center', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
                    <span style={{ color: '#166534', fontWeight: 'bold' }}>All Done!</span>
                    <p style={{ fontSize: '0.875rem', color: '#15803d', marginTop: '0.25rem' }}>You have already made clockin and clockout for today.</p>
                  </div>
                  <button disabled className="clock-btn disabled" style={{ opacity: 0.7 }}>
                    <Clock3 size={16} /> Day Completed
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => clockOutMutation.mutate()} 
                  disabled={clockOutMutation.isPending} 
                  className="clock-btn clock-out"
                >
                  <Clock3 size={16} /> Clockout
                </button>
              )}
            </>
          ) : (
            <>
              {currentTime.getHours() >= 10 && (
                 <div style={{ backgroundColor: 'var(--danger-50)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Missed Punch</span>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>You missed your clock in for today's shift.</p>
                 </div>
              )}
              <button 
                onClick={() => clockInMutation.mutate()} 
                disabled={clockInMutation.isPending} 
                className="clock-btn clock-in"
              >
                <Clock3 size={16} /> Clock In
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Apps, Requests, Events */}
      <div className="portal-main-grid">
        
        {/* Left Column */}
        <div className="apps-card">
          <div className="section-header">
            <h2 className="section-title">My Apps</h2>
            <a href="#" className="view-all-link">View All</a>
          </div>
          
          <div className="apps-grid">
            <div onClick={() => navigate('/employee/work/tasks')} className="app-item cursor-pointer">
              <div className="app-icon-wrapper tasks">
                <CheckCircle size={28} />
              </div>
              <span className="app-label">Task Box</span>
            </div>

            <div onClick={() => navigate('/employee/work/timesheets')} className="app-item cursor-pointer">
              <div className="app-icon-wrapper timesheets">
                <Clock size={28} />
              </div>
              <span className="app-label">Timesheets</span>
            </div>

            <div onClick={() => navigate('/employee/profile')} className="app-item cursor-pointer">
              <div className="app-icon-wrapper profile">
                <User size={28} />
              </div>
              <span className="app-label">Profile</span>
            </div>
            
            <div onClick={() => navigate('/employee/leave/apply')} className="app-item cursor-pointer">
              <div className="app-icon-wrapper comp">
                <Sun size={28} />
              </div>
              <span className="app-label">Leave</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          
          {/* Requests Section */}
          <div className="apps-card">
            <div className="section-header">
              <h2 className="section-title">Requests</h2>
              <a href="#" className="view-all-link">View All</a>
            </div>
            
            <div className="requests-grid">
              <div className="request-item leave cursor-pointer" onClick={() => navigate('/employee/leave/apply')}>
                <FilePlus size={24} className="request-icon" />
                <span className="request-label">Apply Leave</span>
              </div>
              <div className="request-item prefs cursor-pointer" onClick={() => navigate('/employee/profile')}>
                <ShieldCheck size={24} className="request-icon" />
                <span className="request-label">Update Preferences</span>
              </div>
              <div className="request-item flow cursor-pointer" onClick={() => navigate('/employee/work/tasks')}>
                <GitMerge size={24} className="request-icon" />
                <span className="request-label">Initiate Flow</span>
              </div>
              <div className="request-item letter cursor-pointer" onClick={() => navigate('/employee/profile')}>
                <FileText size={24} className="request-icon" />
                <span className="request-label">Request Letter</span>
              </div>
            </div>
          </div>

          {/* Events Section */}
          <div className="events-card">
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>Events</h2>
            
            <div className="events-tabs">
              <div 
                onClick={() => setActiveEventTab('Leave')}
                className={`event-tab ${activeEventTab === 'Leave' ? 'active' : ''}`}
              >
                Leave
                {activeEventTab === 'Leave' && <div className="event-tab-indicator" />}
              </div>
              <div 
                onClick={() => setActiveEventTab('Birthdays')}
                className={`event-tab ${activeEventTab === 'Birthdays' ? 'active' : ''}`}
              >
                Birthdays
                {activeEventTab === 'Birthdays' && <div className="event-tab-indicator" />}
              </div>
              <div 
                onClick={() => setActiveEventTab('Anniversaries')}
                className={`event-tab ${activeEventTab === 'Anniversaries' ? 'active' : ''}`}
              >
                Anniversaries
                {activeEventTab === 'Anniversaries' && <div className="event-tab-indicator" />}
              </div>
            </div>
            
            <div className="events-content text-sm text-subtle py-6 text-center">
              {activeEventTab === 'Leave' && 'No upcoming leave found in your team.'}
              {activeEventTab === 'Birthdays' && 'No birthdays today.'}
              {activeEventTab === 'Anniversaries' && 'No work anniversaries today.'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
