import React, { useState } from 'react';
import { Clock, Check, X, Search, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import './ManagerLeaveApprovals.css';

export function ManagerLeaveApprovals() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const organizationId = user?.organizationId;

  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['pendingLeaveApprovals', organizationId],
    queryFn: async () => {
      const res = await api.get('/leave/pending-approvals', { params: { organizationId } });
      return res.data.data;
    },
    enabled: !!organizationId
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const res = await api.put(`/leave/review/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingLeaveApprovals'] });
      alert('Leave request updated successfully.');
    },
    onError: (err: any) => {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to review leave request.');
    }
  });

  const requests = approvalsData || [];

  const filteredRequests = requests.filter((req: any) => {
    const employeeName = `${req.employee?.firstName} ${req.employee?.lastName}`.toLowerCase();
    const typeName = req.leaveType?.name?.toLowerCase() || '';
    return employeeName.includes(searchTerm.toLowerCase()) || typeName.includes(searchTerm.toLowerCase());
  });

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    if (window.confirm(`Are you sure you want to ${status} this request?`)) {
      reviewMutation.mutate({ id, status });
    }
  };

  return (
    <div className="leave-approvals-container">
      <div className="approvals-header">
        <div className="approvals-title-wrapper">
          <h1 className="approvals-title">
            <div className="approvals-icon-wrapper">
              <Clock size={24} />
            </div>
            Leave Approvals
          </h1>
          <p className="approvals-subtitle">Review and approve your team's leave requests.</p>
        </div>
      </div>

      <div className="approvals-data-section">
        <div className="data-section-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text"
              placeholder="Search employee or leave type..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #8b5cf6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            </div>
            <h3 className="empty-title">Loading requests...</h3>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Check className="empty-icon" size={32} />
            </div>
            <h3 className="empty-title">All caught up!</h3>
            <p className="empty-subtitle">There are no pending leave requests from your team.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req: any) => (
                  <tr key={req.id} className="table-row">
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {req.employee?.firstName?.charAt(0)}{req.employee?.lastName?.charAt(0)}
                        </div>
                        <div className="employee-info">
                          <div className="employee-name">
                            {req.employee?.firstName} {req.employee?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="leave-type">{req.leaveType?.name}</span>
                    </td>
                    <td>
                      <div className="duration-info">
                        <div className="duration-dates">
                          {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                        </div>
                        <div className="duration-days">{req.totalDays} Day(s)</div>
                      </div>
                    </td>
                    <td title={req.reason}>
                      <div className="reason-text">{req.reason || '-'}</div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleReview(req.id, 'approved')}
                          disabled={reviewMutation.isPending}
                          className="btn-approve"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleReview(req.id, 'rejected')}
                          disabled={reviewMutation.isPending}
                          className="btn-reject"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
