import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function LeaveCalendarWidget({ calendar, loading }: { calendar: any[]; loading: boolean }) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Dummy calendar grid generation
  const generateGrid = () => {
    const grid = [];
    for (let i = 0; i < 35; i++) {
      grid.push({
        date: i + 1 > 31 ? (i + 1) % 31 : i + 1,
        isCurrentMonth: i >= 3 && i < 34,
        hasLeave: i === 12 || i === 18 || i === 19
      });
    }
    return grid;
  };

  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <div>
          <h3 className="leave-card-title">Leave Calendar</h3>
          <p className="leave-card-subtitle">Team availability schedule</p>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button className="leave-action-btn"><ChevronLeft size={18} /></button>
          <button className="leave-action-btn"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div className="flex justify-center items-center flex-1"><Spinner /></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {days.map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {day}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', flex: 1 }}>
              {generateGrid().map((cell, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    aspectRatio: '1',
                    color: cell.isCurrentMonth ? (cell.hasLeave ? 'var(--brand-600)' : 'var(--text-primary)') : 'var(--text-muted)',
                    backgroundColor: cell.hasLeave ? 'var(--brand-50)' : 'transparent',
                    cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                    border: cell.isCurrentMonth && !cell.hasLeave ? '1px solid transparent' : 'none'
                  }}
                  className={cell.isCurrentMonth && !cell.hasLeave ? 'hover:bg-slate-50 hover:border-slate-200' : ''}
                >
                  {cell.date}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--brand-500)' }}></div>
                <span>Approved Leave</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--warning)' }}></div>
                <span>Pending Request</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
