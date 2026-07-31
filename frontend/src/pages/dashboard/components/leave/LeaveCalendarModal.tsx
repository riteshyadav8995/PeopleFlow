import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';
import { X as CloseIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function LeaveCalendarModal({ orgId, onClose }: { orgId: string, onClose: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['orgLeaveCalendarFull', orgId, month, year],
    queryFn: () => leaveService.getOrgLeaveCalendar(orgId, month, year),
    enabled: !!orgId
  });

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const grid = [];
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = new Date(year, month - 1, i).toISOString().split('T')[0];
    const leavesForDay = calendarData?.filter((req: any) => {
      const start = new Date(req.startDate).toISOString().split('T')[0];
      const end = new Date(req.endDate).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    }) || [];
    grid.push({ date: i, leaves: leavesForDay });
  }

  return (
    <div className="leave-modal-overlay">
      <div className="leave-modal-content" style={{ maxWidth: '800px', width: '90%', padding: 0 }}>
        <div className="leave-modal-header">
          <div>
            <h3 className="leave-card-title">Leave Calendar</h3>
            <p className="leave-card-subtitle">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="leave-action-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <button className="leave-action-btn" onClick={nextMonth}><ChevronRight size={20} /></button>
            <button className="leave-action-btn" onClick={onClose} style={{ marginLeft: '1rem' }}><CloseIcon size={20} /></button>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem', minHeight: '400px' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner /></div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                {days.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {grid.map((cell, idx) => (
                  <div key={idx} style={{ 
                    minHeight: '80px', 
                    padding: '0.5rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    background: cell ? 'var(--bg-surface)' : 'var(--bg-body)',
                    opacity: cell ? 1 : 0.5
                  }}>
                    {cell && (
                      <>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{cell.date}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {cell.leaves.map((l: any, i: number) => (
                            <div key={i} style={{ 
                              fontSize: '0.65rem', 
                              padding: '0.25rem', 
                              background: l.status === 'approved' ? 'var(--brand-50)' : 'var(--warning-light)', 
                              color: l.status === 'approved' ? 'var(--brand-700)' : 'var(--warning-dark)',
                              borderRadius: 'var(--radius-sm)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={`${l.employee?.firstName} - ${l.type || l.leaveType?.name}`}>
                              {l.employee?.firstName}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
