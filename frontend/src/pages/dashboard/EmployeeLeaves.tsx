import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function EmployeeLeaves() {
  const { user } = useAuthStore();
  const orgId = user?.tenantId || 'demo-org-id';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'balances' | 'requests' | 'approvals'>('balances');
  
  // New Leave Form State
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const year = new Date().getFullYear();

  const { data: types } = useQuery({
    queryKey: ['leaveTypes', orgId],
    queryFn: () => leaveService.getTypes(orgId)
  });

  const { data: balances, isLoading: loadingBalances } = useQuery({
    queryKey: ['leaveBalances', orgId, year],
    queryFn: () => leaveService.getBalances(orgId, year),
    enabled: activeTab === 'balances'
  });

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['myLeaveRequests', orgId],
    queryFn: () => leaveService.getMyRequests(orgId),
    enabled: activeTab === 'requests' || activeTab === 'balances'
  });

  const { data: approvals, isLoading: loadingApprovals } = useQuery({
    queryKey: ['pendingLeaveApprovals', orgId],
    queryFn: () => leaveService.getPendingApprovals(orgId),
    enabled: activeTab === 'approvals'
  });

  const requestMutation = useMutation({
    mutationFn: () => leaveService.requestLeave({ organizationId: orgId, leaveTypeId, startDate, endDate, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      alert('Leave requested successfully');
      setLeaveTypeId(''); setStartDate(''); setEndDate(''); setReason('');
      setActiveTab('requests');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to request leave')
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string, status: 'approved' | 'rejected', rejectionReason?: string }) => 
      leaveService.reviewLeave(id, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingLeaveApprovals'] });
      alert('Leave request reviewed');
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to review leave')
  });

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          My Leaves
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your time off and review team requests.</p>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        {[
          { id: 'balances', label: 'My Balances & Request' },
          { id: 'requests', label: 'My Leave History' },
          { id: 'approvals', label: 'Team Approvals' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'balances' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold">Your Balances ({year})</h2>
              {loadingBalances ? <Spinner /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {balances?.length === 0 ? (
                    <div className="col-span-2 text-gray-500 py-4">Leave balances not yet initialized for this year.</div>
                  ) : (
                    balances?.map((b: any) => (
                      <Card key={b.id} className="border-l-4 border-indigo-600">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{b.leaveType.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">Total: {b.totalDays} days</p>
                          </div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {b.totalDays - b.usedDays - b.pendingDays} <span className="text-sm font-normal text-gray-500">left</span>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-4 text-sm text-gray-600 border-t pt-3">
                          <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Used: {b.usedDays}</div>
                          <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-orange-500" /> Pending: {b.pendingDays}</div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>

            <Card className="lg:col-span-1 bg-gray-50 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Request Leave</h2>
              <form onSubmit={(e) => { e.preventDefault(); requestMutation.mutate(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <select 
                    required 
                    value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select Type</option>
                    {types?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 p-2 w-full border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 p-2 w-full border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1 p-2 w-full border rounded-md text-sm" />
                </div>
                <button type="submit" disabled={requestMutation.isPending} className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </Card>
          </div>
        )}

        {activeTab === 'requests' && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">My Leave Requests</h2>
            {loadingRequests ? <Spinner /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Days</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests?.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No requests found.</td></tr>
                    ) : (
                      requests?.map((req: any) => (
                        <tr key={req.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{req.leaveType.name}</td>
                          <td className="px-4 py-3">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{req.totalDays}</td>
                          <td className="px-4 py-3 max-w-xs truncate">{req.reason}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {req.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'approvals' && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Pending Approvals</h2>
            {loadingApprovals ? <Spinner /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Days</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals?.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No pending approvals.</td></tr>
                    ) : (
                      approvals?.map((req: any) => (
                        <tr key={req.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{req.employee.firstName} {req.employee.lastName}</td>
                          <td className="px-4 py-3">{req.leaveType.name}</td>
                          <td className="px-4 py-3">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{req.totalDays}</td>
                          <td className="px-4 py-3 max-w-xs truncate">{req.reason}</td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <button onClick={() => reviewMutation.mutate({ id: req.id, status: 'approved' })} className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors"><CheckCircle className="w-5 h-5"/></button>
                            <button onClick={() => reviewMutation.mutate({ id: req.id, status: 'rejected' })} className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"><XCircle className="w-5 h-5"/></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
