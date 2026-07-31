import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function LeaveExceptionsWidget({ exceptions, loading }: { exceptions: any[]; loading: boolean }) {
  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={20} />
          </div>
          <h3 className="leave-card-title">Balance Exceptions</h3>
        </div>
      </div>
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div className="flex justify-center items-center flex-1"><Spinner /></div>
        ) : exceptions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <p className="text-muted">No leave balance exceptions.</p>
          </div>
        ) : (
          exceptions?.map((exception: any) => (
            <div key={exception.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
              <div className="leave-avatar">
                {exception.employee?.firstName?.[0] || '?'}{exception.employee?.lastName?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{exception.employee?.firstName} {exception.employee?.lastName}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{exception.type || 'Leave Balance Issue'}</p>
                  </div>
                  <span className="leave-badge leave-badge-danger">Needs Review</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem', fontWeight: 500 }}>
                  {exception.description || 'Negative leave balance detected.'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
