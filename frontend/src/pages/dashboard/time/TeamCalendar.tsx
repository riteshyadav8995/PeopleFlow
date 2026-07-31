import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import './TeamCalendar.css';

export function TeamCalendar() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: teamRequests, isLoading } = useQuery({
    queryKey: ['teamLeaveCalendar', organizationId, currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const res = await api.get('/leave/team-requests', { 
        params: { organizationId, status: 'approved' } 
      });
      return res.data.data || [];
    },
    enabled: !!organizationId
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // Process data for rendering
  const teamMap = new Map();
  
  if (teamRequests) {
    teamRequests.forEach((req: any) => {
      const empId = req.employeeId;
      if (!teamMap.has(empId)) {
        teamMap.set(empId, {
          id: empId,
          name: `${req.employee?.firstName} ${req.employee?.lastName}`,
          role: req.employee?.designation?.title || 'Team Member',
          leaveDays: new Set()
        });
      }
      
      const member = teamMap.get(empId);
      
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === month && d.getFullYear() === year) {
          member.leaveDays.add(d.getDate());
        }
      }
    });
  }

  const teamMembers = Array.from(teamMap.values());

  return (
    <div className="team-calendar-container">
      <div className="calendar-header">
        <div className="calendar-title-wrapper">
          <h1 className="calendar-title">
            <div className="calendar-icon-wrapper">
              <CalendarIcon size={24} />
            </div>
            Team Calendar
          </h1>
          <p className="calendar-subtitle">View your team's availability and approved leaves.</p>
        </div>
        
        <div className="month-navigator">
          <button className="nav-btn" onClick={prevMonth}>
            <ChevronLeft size={20} />
          </button>
          <span className="month-display">
            {monthName}
          </span>
          <button className="nav-btn" onClick={nextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-table-card">
        {isLoading ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #4f46e5', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            </div>
            <h3 className="empty-title">Loading Calendar...</h3>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <CalendarIcon className="empty-icon" size={32} />
            </div>
            <h3 className="empty-title">No approved leaves this month</h3>
            <p className="empty-subtitle">Your team members have no scheduled time off in {monthName}.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="calendar-table">
              <thead>
                <tr>
                  <th className="th-member">
                    Team Member
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dateObj = new Date(year, month, day);
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                    const dayLabel = ['S','M','T','W','T','F','S'][dateObj.getDay()];
                    return (
                      <th key={day} className={`th-day ${isWeekend ? 'weekend' : ''}`}>
                        <div className="day-label">{dayLabel}</div>
                        <div className={`day-number ${isWeekend ? 'weekend' : ''}`}>{day}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, idx) => (
                  <tr key={idx} className="member-row">
                    <td className="td-member">
                      <div className="member-cell">
                        <div className="member-avatar">
                          {member.name.charAt(0)}
                        </div>
                        <div className="member-info">
                          <div className="member-name">{member.name}</div>
                          <div className="member-role">{member.role}</div>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const dateObj = new Date(year, month, day);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      const isOnLeave = member.leaveDays.has(day);
                      return (
                        <td key={day} className={`td-day ${isWeekend ? 'weekend' : ''}`}>
                          {isOnLeave ? (
                            <div className="leave-day-cell">
                              <div className="leave-dot"></div>
                              <div className="leave-tooltip">
                                On Leave
                              </div>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color leave"></div> On Leave
        </div>
        <div className="legend-item">
          <div className="legend-color weekend"></div> Weekend
        </div>
      </div>
    </div>
  );
}
