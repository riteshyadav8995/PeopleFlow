import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

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
      case 'approved': return <span className="px-2 py-1 bg-success-50 text-success rounded-full text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle size={12}/> Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-danger-50 text-danger rounded-full text-xs font-medium flex items-center gap-1 w-fit"><XCircle size={12}/> Rejected</span>;
      default: return <span className="px-2 py-1 bg-warning-50 text-warning rounded-full text-xs font-medium flex items-center gap-1 w-fit"><AlertCircle size={12}/> Pending</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-heading">Team Attendance Corrections</h1>
        <p className="text-subtle mt-1">Review and approve punch correction requests from your team.</p>
      </div>

      <Card>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-10 text-subtle">Loading requests...</div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-10 text-subtle">No correction requests from your team.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-sm font-semibold text-subtle">Employee</th>
                    <th className="pb-3 text-sm font-semibold text-subtle">Date</th>
                    <th className="pb-3 text-sm font-semibold text-subtle">Requested Time</th>
                    <th className="pb-3 text-sm font-semibold text-subtle">Reason</th>
                    <th className="pb-3 text-sm font-semibold text-subtle">Status</th>
                    <th className="pb-3 text-sm font-semibold text-subtle text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((corr: any) => (
                    <tr key={corr.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="py-4">
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
                      <td className="py-4 text-right">
                        {corr.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="!text-danger border-danger hover:bg-danger-50"
                              onClick={() => rejectMutation.mutate(corr.id)}
                              isLoading={rejectMutation.isPending && rejectMutation.variables === corr.id}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => approveMutation.mutate(corr.id)}
                              isLoading={approveMutation.isPending && approveMutation.variables === corr.id}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Approve
                            </Button>
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
      </Card>
    </div>
  );
}
