import './Leaves.css';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';
import { useState } from 'react';

// Modular Components
import { LeaveHeader } from './components/leave/LeaveHeader';
import { LeaveFilterBar } from './components/leave/LeaveFilterBar';
import { LeaveKPICards } from './components/leave/LeaveKPICards';
import { LeaveRequestsTable } from './components/leave/LeaveRequestsTable';
import { LeaveApprovalQueue } from './components/leave/LeaveApprovalQueue';
import { LeaveCalendarWidget } from './components/leave/LeaveCalendarWidget';
import { LeaveDepartmentDistributionChart } from './components/leave/LeaveDepartmentDistributionChart';
import { LeaveAnalyticsChart } from './components/leave/LeaveAnalyticsChart';
import { LeaveDepartmentSummary } from './components/leave/LeaveDepartmentSummary';
import { LeavePoliciesAndEvents } from './components/leave/LeavePoliciesAndEvents';
import { LeaveExceptionsWidget } from './components/leave/LeaveExceptionsWidget';
import { LeaveCalendarModal } from './components/leave/LeaveCalendarModal';
import { CreateLeavePolicyModal } from './components/leave/CreateLeavePolicyModal';

export function Leaves() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isPolicyFormOpen, setIsPolicyFormOpen] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    type: '',
    status: '',
    date: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', department: '', type: '', status: '', date: '' });
  };

  // Data Fetching
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['orgLeaveStats', orgId],
    queryFn: () => leaveService.getOrgDashboardStats(orgId!),
    enabled: !!orgId
  });

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['orgLeaveRequests', orgId, filters.status, filters.type, filters.search],
    queryFn: () => leaveService.getOrgLeaveRequests(orgId!, { 
      status: filters.status || undefined, 
      type: filters.type || undefined, 
      search: filters.search || undefined 
    }),
    enabled: !!orgId
  });

  const { data: calendar, isLoading: loadingCalendar } = useQuery({
    queryKey: ['orgLeaveCalendar', orgId, currentMonth, currentYear],
    queryFn: () => leaveService.getOrgLeaveCalendar(orgId!, currentMonth, currentYear),
    enabled: !!orgId
  });

  const { data: trend, isLoading: loadingTrend } = useQuery({
    queryKey: ['orgLeaveTrend', orgId, currentYear],
    queryFn: () => leaveService.getMonthlyLeaveTrend(orgId!, currentYear),
    enabled: !!orgId
  });

  const { data: distribution, isLoading: loadingDistribution } = useQuery({
    queryKey: ['orgLeaveDistribution', orgId],
    queryFn: () => leaveService.getDepartmentLeaveDistribution(orgId!),
    enabled: !!orgId
  });

  const { data: deptSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['orgLeaveDeptSummary', orgId, currentYear],
    queryFn: () => leaveService.getDepartmentSummary(orgId!, currentYear),
    enabled: !!orgId
  });

  const { data: policies, isLoading: loadingPolicies } = useQuery({
    queryKey: ['orgLeavePolicies', orgId],
    queryFn: () => leaveService.getLeavePolicies(orgId!),
    enabled: !!orgId
  });

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['orgLeaveEvents', orgId],
    queryFn: () => leaveService.getUpcomingEvents(orgId!),
    enabled: !!orgId
  });

  const { data: exceptions, isLoading: loadingExceptions } = useQuery({
    queryKey: ['orgLeaveExceptions', orgId],
    queryFn: () => leaveService.getLeaveBalanceExceptions(orgId!),
    enabled: !!orgId
  });

  if (!orgId) return null;

  const handleExportReport = () => {
    if (!requests || requests.length === 0) {
      alert('No requests to export');
      return;
    }
    const headers = ['Employee Name', 'Department', 'Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Applied On'];
    const csvContent = [
      headers.join(','),
      ...requests.map((r: any) => [
        `"${r.employee?.firstName} ${r.employee?.lastName}"`,
        `"${r.employee?.department?.name || ''}"`,
        `"${r.type || r.leaveType?.name}"`,
        new Date(r.startDate).toISOString().split('T')[0],
        new Date(r.endDate).toISOString().split('T')[0],
        r.totalDays,
        r.status,
        new Date(r.createdAt).toISOString().split('T')[0]
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="leave-dashboard">
      <LeaveHeader 
        onExport={handleExportReport}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenPolicyForm={() => setIsPolicyFormOpen(true)}
      />
      
      <LeaveKPICards stats={stats} loading={loadingStats} />
      
      <LeaveFilterBar filters={filters} onFilterChange={handleFilterChange} onReset={handleResetFilters} />
      
      {/* 12-Column Grid Layouts mapped to 8-4 custom grid */}
      
      {/* Row 2: Requests Table (8) + Approval Queue (4) */}
      <div className="leave-grid-8-4">
        <div style={{ height: '500px' }}>
          <LeaveRequestsTable requests={requests || []} loading={loadingRequests} />
        </div>
        <div style={{ height: '500px' }}>
          <LeaveApprovalQueue requests={requests || []} loading={loadingRequests} />
        </div>
      </div>

      {/* Row 3: Monthly Leave Calendar (8) + Department Distribution (4) */}
      <div className="leave-grid-8-4">
        <div style={{ height: '400px' }}>
          <LeaveCalendarWidget calendar={calendar || []} loading={loadingCalendar} />
        </div>
        <div style={{ height: '400px' }}>
          <LeaveDepartmentDistributionChart data={distribution || []} loading={loadingDistribution} />
        </div>
      </div>

      {/* Row 4: Analytics Chart (12) */}
      <div style={{ width: '100%' }}>
        <LeaveAnalyticsChart data={trend || []} loading={loadingTrend} />
      </div>

      {/* Row 5: Department Summary (12) */}
      <div style={{ width: '100%' }}>
        <LeaveDepartmentSummary data={deptSummary || []} loading={loadingSummary} />
      </div>

      {/* Row 6 & 7: Policies & Events (8) + Exceptions Widget (4) */}
      <div className="leave-grid-8-4">
        <div style={{ height: '400px' }}>
          <LeavePoliciesAndEvents 
            policies={policies || []} 
            events={events} 
            loadingPolicies={loadingPolicies} 
            loadingEvents={loadingEvents} 
          />
        </div>
        <div style={{ height: '400px' }}>
          <LeaveExceptionsWidget exceptions={exceptions || []} loading={loadingExceptions} />
        </div>
      </div>
      
      {isCalendarOpen && (
        <LeaveCalendarModal 
          orgId={orgId}
          onClose={() => setIsCalendarOpen(false)} 
        />
      )}
      
      {isPolicyFormOpen && (
        <CreateLeavePolicyModal 
          orgId={orgId}
          onClose={() => setIsPolicyFormOpen(false)} 
        />
      )}
    </div>
  );
}
