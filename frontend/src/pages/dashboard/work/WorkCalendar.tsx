import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import './WorkCalendar.css';

export function WorkCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNumber = currentDate.getMonth() + 1;
  const yearNumber = currentDate.getFullYear();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Fetch calendar events
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', monthNumber, yearNumber],
    queryFn: async () => {
      const res = await api.get('/dashboard/calendar', { 
        params: { month: monthNumber, year: yearNumber } 
      });
      return res.data.data;
    }
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar grid dynamically
  const { days, gridDays } = useMemo(() => {
    const firstDay = new Date(yearNumber, monthNumber - 1, 1);
    const lastDay = new Date(yearNumber, monthNumber, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDays = lastDay.getDate();

    const previousMonthLastDay = new Date(yearNumber, monthNumber - 1, 0).getDate();

    const grid = [];
    
    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      grid.push({
        day: previousMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        date: new Date(yearNumber, monthNumber - 2, previousMonthLastDay - startingDayOfWeek + i + 1)
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(yearNumber, monthNumber - 1, i)
      });
    }

    // Next month padding (make it 35 or 42 grid cells)
    const remainingCells = grid.length > 35 ? 42 - grid.length : 35 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(yearNumber, monthNumber, i)
      });
    }

    return { days: totalDays, gridDays: grid };
  }, [monthNumber, yearNumber]);

  // Map API data to events
  const events = useMemo(() => {
    if (!calendarData) return [];
    const allEvents: any[] = [];
    
    calendarData.holidays?.forEach((h: any) => {
      const d = new Date(h.date);
      allEvents.push({ day: d.getDate(), month: d.getMonth() + 1, title: h.name, type: 'holiday' });
    });
    
    calendarData.tasks?.forEach((t: any) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        allEvents.push({ day: d.getDate(), month: d.getMonth() + 1, title: t.title, type: 'deadline' });
      }
    });

    calendarData.meetings?.forEach((m: any) => {
      const d = new Date(m.startTime);
      allEvents.push({ day: d.getDate(), month: d.getMonth() + 1, title: m.title, type: 'meeting' });
    });

    return allEvents;
  }, [calendarData]);

  const getEventColor = (type: string) => {
    switch(type) {
      case 'meeting': return { bg: '#dbeafe', color: '#1d4ed8' };
      case 'deadline': return { bg: '#fee2e2', color: '#b91c1c' };
      case 'holiday': return { bg: '#dcfce7', color: '#15803d' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div>
          <h1 className="calendar-title">Work Calendar</h1>
          <p className="calendar-subtitle">Track meetings, deadlines, and holidays.</p>
        </div>
        
        <div className="calendar-controls">
          <button className="btn-filter">
            <Filter size={18} /> Filters
          </button>
          
          <div className="month-nav">
            <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
            <span className="month-label">{currentMonthName}</span>
            <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><span className="legend-dot meeting"></span> Meetings</div>
        <div className="legend-item"><span className="legend-dot deadline"></span> Tasks/Deadlines</div>
        <div className="legend-item"><span className="legend-dot holiday"></span> Holidays</div>
      </div>

      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading calendar...</div>
      ) : (
        <div className="calendar-grid-wrapper">
          <div className="calendar-days-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="day-header-cell">{day}</div>
            ))}
          </div>
          <div className="calendar-days-grid" style={{ gridTemplateRows: gridDays.length > 35 ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)' }}>
            {gridDays.map((gridItem, idx) => {
              const dayEvents = gridItem.isCurrentMonth 
                ? events.filter(e => e.day === gridItem.day && e.month === monthNumber)
                : [];

              return (
                <div key={idx} className={`day-cell ${gridItem.isCurrentMonth ? 'current-month' : 'other-month'}`}>
                  <div className="day-number">
                    {gridItem.day}
                  </div>
                  <div className="events-list">
                    {dayEvents.map((evt, eIdx) => {
                      const colors = getEventColor(evt.type);
                      return (
                        <div 
                          key={eIdx} 
                          className="event-item"
                          style={{ background: colors.bg, color: colors.color }}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
