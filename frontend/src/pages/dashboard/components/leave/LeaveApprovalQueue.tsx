import { Check, X } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';

export function LeaveApprovalQueue({ requests, loading }: { requests: any[]; loading: boolean }) {
  const queryClient = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => leaveService.reviewLeave(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgLeaveRequests'] });
    }
  });
  const pendingRequests = requests?.filter(r => r.status?.toLowerCase() === 'pending') || [];
  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <div>
          <h3 className="leave-card-title">Approval Queue</h3>
          <p className="leave-card-subtitle">Leave requests awaiting your action.</p>
        </div>
        <div className="leave-badge leave-badge-warning">{pendingRequests.length}</div>
      </div>
      
      {loading || reviewMutation.isPending ? (
        <div className="flex justify-center items-center flex-1"><Spinner /></div>
      ) : pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>No pending requests in the queue.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {pendingRequests.map((req) => (
            <div key={req.id} className="leave-queue-item">
              <div className="leave-avatar">
                {req.employee?.firstName?.[0] || '?'}{req.employee?.lastName?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 className="leave-employee-name">{req.employee?.firstName} {req.employee?.lastName}</h4>
                    <p className="leave-employee-meta">{req.type || req.leaveType?.name || 'Leave'}</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{req.totalDays} Days</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button 
                    className="leave-action-btn leave-action-approve" 
                    title="Approve"
                    onClick={() => reviewMutation.mutate({ id: req.id, data: { status: 'approved' } })}
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    className="leave-action-btn leave-action-reject" 
                    title="Reject"
                    onClick={() => reviewMutation.mutate({ id: req.id, data: { status: 'rejected' } })}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
