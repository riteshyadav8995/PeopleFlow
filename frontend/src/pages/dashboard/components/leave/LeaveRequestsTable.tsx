import { Eye, Check, X, X as CloseIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';
import { useState } from 'react';

export function LeaveRequestsTable({ requests, loading }: { requests: any[]; loading: boolean }) {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => leaveService.reviewLeave(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgLeaveRequests'] });
      setSelectedRequest(null);
    }
  });

  const handleApprove = (id: string) => {
    reviewMutation.mutate({ id, data: { status: 'approved' } });
  };

  const handleReject = (id: string) => {
    reviewMutation.mutate({ id, data: { status: 'rejected' } });
  };

  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <div>
          <h3 className="leave-card-title">Leave Requests</h3>
          <p className="leave-card-subtitle">Manage and review all employee leave requests.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn btn-secondary">Bulk Approve</button>
           <button className="btn btn-secondary">Bulk Reject</button>
        </div>
      </div>
      
      {loading || reviewMutation.isPending ? (
        <div className="flex justify-center items-center flex-1 p-12"><Spinner /></div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
          <p className="text-muted">No leave requests found.</p>
        </div>
      ) : (
        <div className="leave-table-container">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Applied On</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div className="leave-employee-cell">
                       <div className="leave-avatar">
                         {req.employee?.firstName?.[0] || '?'}{req.employee?.lastName?.[0] || '?'}
                       </div>
                       <div>
                         <p className="leave-employee-name">{req.employee?.firstName} {req.employee?.lastName}</p>
                         <p className="leave-employee-meta">{req.employee?.employeeCode || 'EMP-000'} • {req.employee?.department?.name || 'Department'}</p>
                       </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{req.type || req.leaveType?.name || 'Leave'}</span>
                  </td>
                  <td>
                    <p style={{ fontWeight: 500 }}>{new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{req.totalDays} days</p>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {new Date(req.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td>
                    <span className={`leave-badge ${
                      req.status?.toLowerCase() === 'approved' ? 'leave-badge-success' : 
                      req.status?.toLowerCase() === 'rejected' ? 'leave-badge-danger' : 
                      'leave-badge-warning'
                    }`} style={{ textTransform: 'capitalize' }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="leave-actions" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className="leave-action-btn" 
                        title="View Details"
                        onClick={() => setSelectedRequest(req)}
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="leave-action-btn leave-action-approve" 
                        title="Approve"
                        onClick={() => handleApprove(req.id)}
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        className="leave-action-btn leave-action-reject" 
                        title="Reject"
                        onClick={() => handleReject(req.id)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="leave-modal-overlay">
          <div className="leave-modal-header">
            <h3 className="leave-card-title">Leave Request Details</h3>
            <button 
              className="leave-action-btn"
              onClick={() => setSelectedRequest(null)}
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <div className="leave-modal-content">
            <div className="leave-employee-cell">
              <div className="leave-avatar" style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
                {selectedRequest.employee?.firstName?.[0] || '?'}{selectedRequest.employee?.lastName?.[0] || '?'}
              </div>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</h4>
                <p className="leave-employee-meta" style={{ fontSize: '0.875rem' }}>{selectedRequest.employee?.department?.name || 'Department'} • {selectedRequest.employee?.employeeCode}</p>
              </div>
            </div>
            
            <div className="leave-grid-2">
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leave Type</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{selectedRequest.type || selectedRequest.leaveType?.name || 'Leave'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{selectedRequest.totalDays} Days</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start Date</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{new Date(selectedRequest.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>End Date</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{new Date(selectedRequest.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {selectedRequest.reason && (
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Reason for leave</p>
                <div style={{ padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{selectedRequest.reason}</p>
                </div>
              </div>
            )}
          </div>
          
          {selectedRequest.status === 'PENDING' && (
            <div className="leave-modal-footer">
              <button 
                className="btn btn-danger" style={{ flex: 1 }}
                onClick={() => handleReject(selectedRequest.id)}
              >
                Reject Request
              </button>
              <button 
                className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => handleApprove(selectedRequest.id)}
              >
                Approve Request
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
