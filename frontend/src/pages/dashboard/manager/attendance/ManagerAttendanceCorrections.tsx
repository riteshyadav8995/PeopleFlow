import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, AlertCircle, User, Check, X } from 'lucide-react';
import './ManagerAttendanceCorrections.css';

export function ManagerAttendanceCorrections() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: corrections = [], isLoading } = useQuery({
    queryKey: ['manager-corrections', user?.organizationId, user?.employeeId],
    queryFn: async () => {
      const res = await api.get(`/attendance/corrections?organizationId=${user?.organizationId}&managerId=${user?.employeeId}`);
      return res.data.data;
    },
    enabled: !!user?.organizationId && !!user?.employeeId
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/attendance/corrections/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-corrections'] });
    },
    onError: (err: any) => {
      alert(`Failed to approve: ${err.response?.data?.message || err.message}`);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/attendance/corrections/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-corrections'] });
    },
    onError: (err: any) => {
      alert(`Failed to reject: ${err.response?.data?.message || err.message}`);
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="mac-status-badge success"><CheckCircle size={12}/> Approved</span>;
      case 'rejected': return <span className="mac-status-badge danger"><XCircle size={12}/> Rejected</span>;
      default: return <span className="mac-status-badge warning"><AlertCircle size={12}/> Pending</span>;
    }
  };

  return (
    <div className="mac-page-container p-6">
      <div className="mac-header">
        <h1 className="mac-page-title">Team Attendance Corrections</h1>
        <p className="mac-page-subtitle">Review and approve punch correction requests from your team.</p>
      </div>

      <div className="mac-table-container">
        {isLoading ? (
          <div className="text-center py-10 text-subtle">Loading requests...</div>
        ) : corrections.length === 0 ? (
          <div className="text-center py-10 text-subtle">No correction requests from your team.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mac-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Requested Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((corr: any, idx: number) => (
                  <tr key={corr.id} className="mac-table-row" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                            {corr.employee?.firstName?.[0]}{corr.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-body">{corr.employee?.firstName} {corr.employee?.lastName}</div>
                            <div className="text-xs text-subtle">{corr.employee?.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-body font-medium">
                        {new Date(corr.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-body text-sm">
                        <div className="font-medium text-brand-600">In: {new Date(corr.requestedClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {corr.requestedClockOut && <div className="text-subtle">Out: {new Date(corr.requestedClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                      </td>
                      <td className="py-4 text-body max-w-[200px] truncate" title={corr.reason}>{corr.reason}</td>
                      <td className="py-4">{getStatusBadge(corr.status)}</td>
                    <td className="text-right">
                      {corr.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <button 
                            className="mac-btn-action approve"
                            onClick={() => approveMutation.mutate(corr.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button 
                            className="mac-btn-action reject"
                            onClick={() => rejectMutation.mutate(corr.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
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
