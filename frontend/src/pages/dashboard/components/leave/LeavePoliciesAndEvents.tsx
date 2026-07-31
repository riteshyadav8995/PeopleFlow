import { Shield, Users } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function LeavePoliciesAndEvents({ policies, events, loadingPolicies, loadingEvents }: any) {
  return (
    <div className="leave-grid-2" style={{ background: 'transparent', padding: 0, border: 'none', height: '100%', gap: '1.5rem' }}>
      <div className="leave-card">
        <div className="leave-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--brand-50)', color: 'var(--brand-600)', borderRadius: 'var(--radius-md)' }}>
              <Shield size={20} />
            </div>
            <h3 className="leave-card-title">Leave Policies</h3>
          </div>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingPolicies ? (
            <div className="flex justify-center items-center flex-1"><Spinner /></div>
          ) : policies?.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <p className="text-muted">No policies defined.</p>
            </div>
          ) : (
            policies?.map((policy: any, index: number) => (
              <div key={index} style={{ padding: '1rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{policy.name}</span>
                  <span className="leave-badge leave-badge-neutral">{policy.type}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{policy.description}</p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-600)' }}>
                  Accrual: {policy.accrualRate} days / {policy.accrualPeriod}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="leave-card">
        <div className="leave-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--brand-50)', color: 'var(--brand-600)', borderRadius: 'var(--radius-md)' }}>
              <Users size={20} />
            </div>
            <h3 className="leave-card-title">Upcoming Events</h3>
          </div>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingEvents ? (
            <div className="flex justify-center items-center flex-1"><Spinner /></div>
          ) : !events || events.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <p className="text-muted">No upcoming events.</p>
            </div>
          ) : (
            Array.isArray(events) && events.map((event: any, index: number) => {
              const eventDate = new Date(event.date || event.startDate);
              return (
                <div key={index} className="leave-event-card">
                  <div className="leave-event-date">
                    <span className="leave-event-month">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                    <span className="leave-event-day">{eventDate.getDate()}</span>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{event.title || event.name}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{event.description || event.type}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
