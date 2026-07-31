import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, MoreVertical, XCircle, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { attendanceService } from '@/services/attendance.service';
import './AttendanceCalendar.css';

export function AttendanceCalendar() {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { user } = useAuthStore();
  const orgId = user?.organizationId || user?.tenantId || '';
  
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance', orgId, month, year],
    queryFn: () => attendanceService.getMyAttendance(orgId, month, year),
    enabled: !!orgId
  });

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      days.push({ 
        date: daysInPrevMonth - firstDay + i + 1, 
        isCurrentMonth: false, 
        isOff: false 
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month - 1, i);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const record = records.find((r: any) => {
        const d = new Date(r.date);
        return d.getDate() === i && d.getMonth() === month - 1 && d.getFullYear() === year;
      });

      days.push({ 
        date: i, 
        isCurrentMonth: true, 
        isOff: isWeekend,
        isPresent: record && record.status === 'present',
        record
      });
    }
    
    // Next month padding
    const remainder = 35 - days.length;
    if (remainder > 0) {
      for (let i = 1; i <= remainder; i++) {
        days.push({ date: i, isCurrentMonth: false, isOff: false });
      }
    } else if (days.length > 35 && days.length < 42) {
      const extra = 42 - days.length;
      for (let i = 1; i <= extra; i++) {
        days.push({ date: i, isCurrentMonth: false, isOff: false });
      }
    }
    
    return days;
  };

  const calendarDays = useMemo(() => generateCalendarDays(), [month, year, records]);

  // Calculate Average Work Duration
  const avgWorkDuration = useMemo(() => {
    if (!records.length) return '00:00 Hrs';
    
    const recordsWithHours = records.filter((r: any) => r.totalHours && r.totalHours > 0);
    if (!recordsWithHours.length) return '00:00 Hrs';

    const total = recordsWithHours.reduce((sum: number, r: any) => sum + r.totalHours, 0);
    const avg = total / recordsWithHours.length;
    
    const h = Math.floor(avg);
    const m = Math.round((avg % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} Hrs`;
  }, [records]);

  return (
    <div className="attendance-calendar-container page-container">
      <div className="calendar-header">
        <h1 className="calendar-title">Attendance</h1>
      </div>

      <div className="metrics-banner" onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}>
        <span className="metrics-label">Metrics</span>
        <div className="metrics-divider"></div>
        <span className="metrics-subtitle">Avg. Work Duration:</span>
        
        <div className="chart-bars">
          <div className="chart-bar" style={{height: '60%'}}></div>
          <div className="chart-bar" style={{height: '80%'}}></div>
          <div className="chart-bar" style={{height: '40%'}}></div>
          <div className="chart-bar" style={{height: '100%'}}></div>
        </div>
        
        <span className="metrics-value">{avgWorkDuration}</span>
        
        <div className="metrics-chevron">
          {isMetricsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <div className="calendar-card">
        <div className="calendar-toolbar">
          <div className="month-nav">
            <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <span className="month-display">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button className="nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>
          <div className="toolbar-actions">
            <button className="action-btn">
              <span className="action-icon">📅</span>
            </button>
            <button className="more-btn">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {daysOfWeek.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
          
          {isLoading ? (
            <div className="col-span-7 py-20 text-center text-gray-500">Loading attendance...</div>
          ) : (
            calendarDays.map((day, idx) => (
              <div key={idx} className={`calendar-cell ${day.isOff ? 'off-day' : 'working-day'}`}>
                <div className="cell-header">
                  <span className={`date-number ${!day.isCurrentMonth ? 'other-month' : day.isOff ? 'off-day' : 'current-month'}`}>
                    {day.date} {day.date === 1 && day.isCurrentMonth ? <span className="month-abbr">{currentDate.toLocaleDateString('en-US', { month: 'short' })}</span> : ''}
                  </span>
                  
                  {day.isPresent && (
                    <div className="presence-indicator" title={day.record?.totalHours ? `${Math.floor(day.record.totalHours)}h ${Math.round((day.record.totalHours % 1) * 60)}m` : 'Present'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                    </div>
                  )}
                </div>
                
                {day.isOff && (
                  <div className="weekly-off-indicator">
                    <XCircle size={12} /> Weekly Off
                  </div>
                )}
                
                {day.record && !day.isOff && !day.isPresent && (
                   <div className="text-xs font-semibold mt-1 text-red-500">
                     {day.record.status === 'absent' ? 'Absent' : day.record.status}
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
