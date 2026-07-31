import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import './ShiftSchedule.css';

export function ShiftSchedule() {
  const currentMonth = "November 2026";
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  
  const [selectedShift, setSelectedShift] = useState<'all' | 'morning' | 'night'>('all');

  const shiftTypes = {
    morning: { label: 'Morning Shift', time: '09:00 AM - 06:00 PM', variant: 'morning' },
    night: { label: 'Night Shift', time: '08:00 PM - 05:00 AM', variant: 'night' },
    off: { label: 'Week Off', time: '-', variant: 'off' },
  };

  const mySchedule = daysInMonth.map(day => {
    const isWeekend = (day % 7) === 0 || (day % 7) === 6;
    if (isWeekend) return 'off';
    if (day > 15 && day <= 20) return 'night';
    return 'morning';
  });

  return (
    <div className="shift-schedule-container">
      {/* Header */}
      <div className="schedule-header">
        <div>
          <h1 className="schedule-title">
            <Calendar color="var(--brand-600)" />
            My Shift Schedule
          </h1>
          <p className="schedule-subtitle">View your assigned working hours for the month.</p>
        </div>
        
        <div className="header-controls">
          <div className="month-selector">
            <button className="month-btn">
              <ChevronLeft size={20} />
            </button>
            <span className="month-label">{currentMonth}</span>
            <button className="month-btn">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button className="download-btn">
            <Download size={16} />
            Download Roster
          </button>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="filters-card">
        <div className="shift-filters">
          <button 
            onClick={() => setSelectedShift('all')}
            className={`filter-tab ${selectedShift === 'all' ? 'active-all' : ''}`}
          >
            All Shifts
          </button>
          <button 
            onClick={() => setSelectedShift('morning')}
            className={`filter-tab ${selectedShift === 'morning' ? 'active-morning' : ''}`}
          >
            Morning
          </button>
          <button 
            onClick={() => setSelectedShift('night')}
            className={`filter-tab ${selectedShift === 'night' ? 'active-night' : ''}`}
          >
            Night
          </button>
        </div>
        <div className="shift-stats">
          <div className="stat-item">
            <div className="stat-dot morning"></div>
            <span className="stat-label">Morning (18)</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot night"></div>
            <span className="stat-label">Night (4)</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot off"></div>
            <span className="stat-label">Week Off (8)</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {daysInMonth.map((day, idx) => {
          const shiftKey = mySchedule[idx] as keyof typeof shiftTypes;
          const shift = shiftTypes[shiftKey];
          
          if (selectedShift !== 'all' && shiftKey !== selectedShift && shiftKey !== 'off') return null;

          return (
            <div 
              key={day} 
              className={`shift-card ${shift.variant}`}
            >
              <div className="card-header">
                <div className="date-info">
                  <span className="date-day">{day}</span>
                  <span className="date-month">Nov</span>
                </div>
                <span className={`shift-badge ${shift.variant}`}>
                  {shift.label}
                </span>
              </div>
              <div className="shift-time">
                <Clock size={14} />
                {shift.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
