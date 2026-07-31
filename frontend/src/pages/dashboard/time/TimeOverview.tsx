import React, { useState, useEffect } from 'react';
import { ChevronDown, Clock, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './TimeOverview.css';

const attendanceData = [
  { name: '21 Jul', hours: 0 },
  { name: '22', hours: 0 },
  { name: '23', hours: 0 },
  { name: '24', hours: 0 },
  { name: '25', hours: 0 },
  { name: '26', hours: 8.5 },
  { name: '27', hours: 0 }
];

export function TimeOverview() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', { hour12: false });
  const formattedDate = time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'long' });

  return (
    <div className="time-overview-container">
      <div className="overview-header-row">
        <div className="overview-title">
          Overview 
          <span className="explore-ui-badge">Explore New UI</span>
        </div>
        <button className="request-btn">
          Request <ChevronDown size={14} />
        </button>
      </div>

      <div className="overview-grid">
        <div className="overview-main-col">
          {/* Pending Requests */}
          <div className="time-card">
            <div className="time-card-header">Pending Requests</div>
            <div className="pending-empty">
              <img src="https://illustrations.popsy.co/blue/work-from-home.svg" alt="No pending requests" />
              There are no pending requests
            </div>
          </div>

          {/* Bottom Row inside Main Col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Attendance Metrics */}
            <div className="time-card">
              <div className="time-card-header">
                Attendance Metrics
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Week <ChevronDown size={12} />
                </div>
              </div>
              <div style={{ height: '200px', width: '100%', fontSize: '0.75rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="hours" fill="#e2e8f0" radius={[2, 2, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leave Balances */}
            <div className="time-card">
              <div className="time-card-header">
                Leave Balances
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, cursor: 'pointer' }}>View All</div>
              </div>
              <div className="leave-balances-grid">
                <div className="leave-balance-item">
                  <div className="leave-balance-value">1.5</div>
                  <div className="leave-balance-label">Casual Leave- AP & TG</div>
                </div>
                <div className="leave-balance-item">
                  <div className="leave-balance-value">0</div>
                  <div className="leave-balance-label">Marriage Leave</div>
                </div>
                <div className="leave-balance-item">
                  <div className="leave-balance-value">1.5</div>
                  <div className="leave-balance-label">Sick Leave- AP & TG</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-side-col">
          {/* Clock Widget */}
          <div className="time-card clock-widget-card">
            <div className="time-card-header" style={{ marginBottom: '1rem' }}>Let's Get the Ball Rolling</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{formattedDate}</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{formattedTime}</span>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <div style={{ color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12}/> 09:40</span>
                <span>Shift: 09:00 - 18:00</span>
              </div>
              <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>View Policies</a>
            </div>

            <button className="clock-btn">
              <Clock size={16} /> Clockout
            </button>
          </div>

          {/* Upcoming Time Off */}
          <div className="time-card">
            <div className="time-card-header">Upcoming Time Off</div>
            <div className="upcoming-list">
              <div className="upcoming-item">
                <div className="upcoming-date">
                  <span className="upcoming-date-main">15 Aug</span>
                  <span className="upcoming-date-sub">Sat</span>
                </div>
                <div className="upcoming-event">
                  <span className="upcoming-event-main">Independence Day</span>
                  <span className="upcoming-event-sub">National Holiday</span>
                </div>
              </div>
              <div className="upcoming-item">
                <div className="upcoming-date">
                  <span className="upcoming-date-main">14 Sep</span>
                  <span className="upcoming-date-sub">Mon</span>
                </div>
                <div className="upcoming-event">
                  <span className="upcoming-event-main">Vinayaka Chathu...</span>
                  <span className="upcoming-event-sub">Holiday</span>
                </div>
              </div>
              <div className="upcoming-item">
                <div className="upcoming-date">
                  <span className="upcoming-date-main">02 Oct</span>
                  <span className="upcoming-date-sub">Fri</span>
                </div>
                <div className="upcoming-event">
                  <span className="upcoming-event-main">Mahatma Gandh...</span>
                  <span className="upcoming-event-sub">National Holiday</span>
                </div>
              </div>
              <div className="upcoming-item">
                <div className="upcoming-date">
                  <span className="upcoming-date-main">21 Oct</span>
                  <span className="upcoming-date-sub">Wed</span>
                </div>
                <div className="upcoming-event">
                  <span className="upcoming-event-main">Next Day Of Vija...</span>
                  <span className="upcoming-event-sub">Holiday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
