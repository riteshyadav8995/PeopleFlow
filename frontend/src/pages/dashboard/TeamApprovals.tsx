import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { 
  CheckCircle, 
  XCircle, 
  Inbox,
  CalendarDays,
  Clock,
  User
} from 'lucide-react';
import { leaveService } from '@/services/leave.service';

export function TeamApprovals() {
  const { user } = useAuthStore();
  const orgId = user?.tenantId || '';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'leaves' | 'timesheets'>('leaves');

  // --- Data Fetching ---
  const { data: leaveApprovals, isLoading: loadingLeaves } = useQuery({
    queryKey: ['pendingLeaveApprovals', orgId],
    queryFn: () => leaveService.getPendingApprovals(orgId),
    enabled: activeTab === 'leaves'
  });

  // --- Mutations ---
  const reviewLeaveMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string, status: 'approved' | 'rejected', rejectionReason?: string }) => 
      leaveService.reviewLeave(id, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingLeaveApprovals'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to review leave')
  });

  return (
    <div className="space-y-6  pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Inbox className="w-7 h-7 text-indigo-600" />
          Team Approvals
        </h1>
        <p className="text-gray-500 mt-1">Review and manage pending requests from your direct reports.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'leaves' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CalendarDays className="w-4 h-4" /> Time Off
          {leaveApprovals?.length ? (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {leaveApprovals.length}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('timesheets')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'timesheets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" /> Timesheets
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'leaves' && (
          <div className="space-y-4">
            {loadingLeaves ? (
              <div className="py-12 flex justify-center"><Spinner /></div>
            ) : leaveApprovals?.length === 0 ? (
              <Card className="py-16 text-center bg-gray-50/50 border-dashed">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                <p className="text-gray-500 mt-1">There are no pending leave requests to review.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {leaveApprovals?.map((req: any) => (
                  <Card key={req.id} className="relative flex flex-col hover:shadow-md transition-shadow border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {req.employee.firstName.charAt(0)}{req.employee.lastName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 leading-tight">
                            {req.employee.firstName} {req.employee.lastName}
                          </h3>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" /> {req.employee.employeeCode || 'EMP'}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                        {req.leaveType.name}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4 flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium text-gray-900">{req.totalDays} day(s)</span>
                      </div>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-500">Dates:</span>
                        <span className="font-medium text-gray-900 text-right">
                          {new Date(req.startDate).toLocaleDateString()} - <br/>{new Date(req.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 block mb-1">Reason:</span>
                        <p className="text-gray-700 italic line-clamp-2">"{req.reason}"</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-auto">
                      <button
                        onClick={() => reviewLeaveMutation.mutate({ id: req.id, status: 'rejected' })}
                        disabled={reviewLeaveMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-red-600 font-medium hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => reviewLeaveMutation.mutate({ id: req.id, status: 'approved' })}
                        disabled={reviewLeaveMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white bg-indigo-600 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timesheets' && (
          <Card className="py-16 text-center bg-gray-50/50 border-dashed">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Timesheets Module</h3>
            <p className="text-gray-500 mt-1">Timesheet approval workflows are not yet active in this phase.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
