import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ActivateAccount } from './pages/auth/ActivateAccount';
import { Overview } from './pages/dashboard/Overview';
import { Employees } from './pages/dashboard/Employees';
import { EmployeeProfile } from './pages/dashboard/EmployeeProfile';
import { Departments } from './pages/dashboard/Departments';
import { Organization } from './pages/dashboard/Organization';
import { Attendance } from './pages/dashboard/Attendance';
import { Leaves } from './pages/dashboard/Leaves';
import { Payroll } from './pages/dashboard/Payroll';
import { MyPortal } from './pages/dashboard/MyPortal';
import { EmployeeAttendance } from './pages/dashboard/EmployeeAttendance';
import { EmployeeLeaves } from './pages/dashboard/EmployeeLeaves';
import { EmployeeProjects } from './pages/dashboard/EmployeeProjects';
import { EmployeePayslips } from './pages/dashboard/EmployeePayslips';
import { EmployeeDocuments } from './pages/dashboard/EmployeeDocuments';
import { TimeOverview } from './pages/dashboard/time/TimeOverview';
import { AttendanceCalendar } from './pages/dashboard/time/AttendanceCalendar';
import { LeaveBalance } from './pages/dashboard/time/LeaveBalance';
import { MyProfile } from './pages/dashboard/profile/MyProfile';
import { PlaceholderPage } from './pages/dashboard/PlaceholderPage';
import { CandidateFeedback } from './pages/dashboard/manager/CandidateFeedback';
import { TeamGoals } from './pages/dashboard/manager/TeamGoals';
import { PerformanceReviews } from './pages/dashboard/manager/PerformanceReviews';
import { OneOnOneMeetings } from './pages/dashboard/manager/OneOnOneMeetings';

import { ManagerAttendanceCorrections } from './pages/dashboard/manager/attendance/ManagerAttendanceCorrections';
import { AttendanceCorrections } from './pages/dashboard/attendance/AttendanceCorrections';
import { TeamFeedback } from './pages/dashboard/manager/TeamFeedback';
import { TeamLeaveBalance } from './pages/dashboard/manager/TeamLeaveBalance';
import { InterviewSchedule } from './pages/dashboard/manager/InterviewSchedule';
import { JobRequisitions } from './pages/dashboard/manager/JobRequisitions';
import { TeamAssets } from './pages/dashboard/manager/TeamAssets';
import { TeamExpenses } from './pages/dashboard/manager/TeamExpenses';
import { TeamReports } from './pages/dashboard/manager/reports/TeamReports';
import { AttendanceReports } from './pages/dashboard/manager/reports/AttendanceReports';
import { LeaveReports } from './pages/dashboard/manager/reports/LeaveReports';
import { ProductivityReports } from './pages/dashboard/manager/reports/ProductivityReports';
import { MyTasks } from './pages/dashboard/work/MyTasks';
import { Timesheets } from './pages/dashboard/work/Timesheets';
import { WorkCalendar } from './pages/dashboard/work/WorkCalendar';
import { ClockInOut } from './pages/dashboard/attendance/ClockInOut';
import { AttendanceHistory } from './pages/dashboard/attendance/AttendanceHistory';
import { ShiftSchedule } from './pages/dashboard/attendance/ShiftSchedule';
import { ApplyLeave } from './pages/dashboard/time/ApplyLeave';
import { MyLeaveRequests } from './pages/dashboard/time/MyLeaveRequests';
import { TeamCalendar } from './pages/dashboard/time/TeamCalendar';
import { ClaimExpense } from './pages/dashboard/expenses/ClaimExpense';
import { ExpenseHistory } from './pages/dashboard/expenses/ExpenseHistory';
import { SalaryStructure } from './pages/dashboard/payroll/SalaryStructure';
import { TaxDocuments } from './pages/dashboard/payroll/TaxDocuments';
import { Reimbursements } from './pages/dashboard/payroll/Reimbursements';
import { AdminReimbursements } from './pages/dashboard/manager/AdminReimbursements';
import { SupportTickets } from './pages/dashboard/help/SupportTickets';
import { CompanyPolicies } from './pages/dashboard/help/CompanyPolicies';
import { ManagerLeaveApprovals } from './pages/dashboard/time/ManagerLeaveApprovals';
import { MyTeam } from './pages/dashboard/team/MyTeam';
import { TeamDirectory } from './pages/dashboard/team/TeamDirectory';
import { OrgChart } from './pages/dashboard/team/OrgChart';
import { TeamTasks } from './pages/dashboard/team/TeamTasks';
import { TeamAttendance } from './pages/dashboard/time/TeamAttendance';
import { TeamPayrollSummary } from './pages/dashboard/payroll/TeamPayrollSummary';
import { MyAssets } from './pages/dashboard/assets/MyAssets';
import { AssetRequests } from './pages/dashboard/assets/AssetRequests';
import { VoiceAgent } from './pages/dashboard/ai/VoiceAgent';
import { HRAssistant } from './pages/dashboard/ai/HRAssistant';
import { TeamApprovals } from './pages/dashboard/TeamApprovals';
import { RecruitmentDashboard } from './pages/dashboard/RecruitmentDashboard';
import { OnboardingDashboard } from './pages/dashboard/OnboardingDashboard';
import { PreJoiningPortal } from './pages/dashboard/PreJoiningPortal';
import { Projects } from './pages/dashboard/Projects';
import { ProjectDetails } from './pages/dashboard/ProjectDetails';
import { VoiceAgentDashboard } from './pages/dashboard/VoiceAgentDashboard';
import { CallTranscriptView } from './pages/dashboard/CallTranscriptView';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { Organizations } from './pages/superadmin/Organizations';
import { SubscriptionPlans } from './pages/superadmin/SubscriptionPlans';
import { PlatformUsage } from './pages/superadmin/PlatformUsage';
import { SystemHealth } from './pages/superadmin/SystemHealth';
import { BackgroundJobs } from './pages/superadmin/BackgroundJobs';
import { CareersPage } from './pages/public/CareersPage';
import PublicLayout from './layouts/PublicLayout';
import JobBoard from './pages/public/JobBoard';
import JobDetails from './pages/public/JobDetails';
import CandidateAuth from './pages/public/CandidateAuth';
import CandidateDashboard from './pages/public/CandidateDashboard';
import { useAuthStore } from './store/auth.store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleGuard({ allowedRoles, fallbackPath, children }: { allowedRoles: string[], fallbackPath: string, children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  // Super admin can access anything
  if (user?.roles?.includes('super_admin')) {
    return <>{children}</>;
  }

  const hasAccess = allowedRoles.some(role => user?.roles?.includes(role));
  
  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
}

function DashboardRoot() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roles?.includes('super_admin');
  const isTenantAdmin = user?.roles?.includes('tenant_admin');

  if (isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  if (isTenantAdmin) {
    return <Navigate to="/organization/dashboard" replace />;
  }
  return <Navigate to="/employee/dashboard" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/activate" element={<ActivateAccount />} />
        </Route>

        {/* Unauthenticated Public Pages */}
        <Route path="/careers" element={<CareersPage />} />

        {/* Public Candidate Portal */}
        <Route element={<PublicLayout />}>
          <Route path="/jobs" element={<JobBoard />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/candidate/login" element={<CandidateAuth />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardRoot />} />

          {/* Organization Workspace Routes - Only for Admins */}
          <Route element={<RoleGuard allowedRoles={['tenant_admin', 'hr_manager']} fallbackPath="/employee/dashboard"><Outlet /></RoleGuard>}>
            <Route path="/organization/dashboard" element={<Overview />} />
          <Route path="/organization/employees" element={<Employees />} />
          <Route path="/organization/employees/:id" element={<EmployeeProfile />} />
          <Route path="/organization/departments" element={<Departments />} />
          <Route path="/organization/recruitment" element={<RecruitmentDashboard />} />
          <Route path="/organization/onboarding" element={<OnboardingDashboard />} />
          <Route path="/organization/attendance" element={<Attendance />} />
          <Route path="/organization/leaves" element={<Leaves />} />
          <Route path="/organization/payroll" element={<Payroll />} />
          <Route path="/organization/projects" element={<Projects />} />
          <Route path="/organization/projects/:id" element={<ProjectDetails />} />
          <Route path="/organization/timesheets" element={<div className="p-8 text-heading">Timesheets Module</div>} />
          <Route path="/organization/voice-agent" element={<VoiceAgentDashboard />} />
          <Route path="/organization/voice-agent/:id" element={<CallTranscriptView />} />
            <Route path="/organization/setup" element={<Organization />} />
            <Route path="/organization/team-approvals" element={<TeamApprovals />} />
          </Route>

          {/* Employee Workspace Routes - Accessible by everyone (employees, managers, admins viewing as employee) */}
          <Route path="/employee/dashboard" element={<MyPortal />} />
          
          {/* My Work */}
          <Route path="/employee/work/tasks" element={<MyTasks />} />
          <Route path="/employee/work/projects" element={<EmployeeProjects />} />
          <Route path="/employee/work/projects/:id" element={<ProjectDetails />} />
          <Route path="/employee/work/timesheets" element={<Timesheets />} />
          <Route path="/employee/work/calendar" element={<WorkCalendar />} />

          {/* Attendance */}
          <Route path="/employee/attendance/clock" element={<ClockInOut />} />
          <Route path="/employee/attendance/my" element={<AttendanceCalendar />} />
          <Route path="/employee/attendance/history" element={<AttendanceHistory />} />
          <Route path="/employee/attendance/shifts" element={<ShiftSchedule />} />

          {/* Leave */}
          <Route path="/employee/leave/apply" element={<ApplyLeave />} />
          <Route path="/employee/leave/requests" element={<MyLeaveRequests />} />
          <Route path="/employee/leave/balance" element={<LeaveBalance />} />
          <Route path="/employee/leave/team" element={<TeamCalendar />} />

          {/* Payroll */}
          <Route path="/employee/payroll/payslips" element={<EmployeePayslips />} />
          <Route path="/employee/payroll/structure" element={<SalaryStructure />} />
          <Route path="/employee/payroll/tax" element={<TaxDocuments />} />
          <Route path="/employee/payroll/reimbursements" element={<Reimbursements />} />

          {/* Profile */}
          <Route path="/employee/profile/*" element={<MyProfile />} />

          {/* Assets */}
          <Route path="/employee/assets/my" element={<MyAssets />} />
          <Route path="/employee/assets/requests" element={<AssetRequests />} />

          {/* Expenses */}
          <Route path="/employee/expenses/claim" element={<ClaimExpense />} />
          <Route path="/employee/expenses/history" element={<ExpenseHistory />} />

          {/* AI Assistant */}
          <Route path="/employee/ai/voice" element={<VoiceAgent />} />
          <Route path="/employee/ai/hr" element={<HRAssistant />} />

          {/* Help */}
          <Route path="/employee/help/tickets" element={<SupportTickets />} />
          <Route path="/employee/help/policies" element={<CompanyPolicies />} />
          <Route path="/employee/help/knowledge" element={<PlaceholderPage title="Knowledge Base" />} />

          {/* Manager Portal Specific Routes - Only for Managers and Admins */}
          <Route element={<RoleGuard allowedRoles={['manager', 'hr_manager', 'tenant_admin', 'team_lead', 'department_head']} fallbackPath="/employee/dashboard"><Outlet /></RoleGuard>}>
            <Route path="/employee/manager/team" element={<MyTeam />} />
          <Route path="/employee/manager/directory" element={<TeamDirectory />} />
          <Route path="/employee/manager/org-chart" element={<OrgChart />} />
          <Route path="/employee/manager/team-tasks" element={<TeamTasks />} />
          <Route path="/employee/manager/attendance" element={<TeamAttendance />} />
          <Route path="/employee/manager/attendance-corrections" element={<ManagerAttendanceCorrections />} />
          <Route path="/employee/manager/leave-requests" element={<ManagerLeaveApprovals />} />
          <Route path="/employee/manager/leave-balance" element={<TeamLeaveBalance />} />
          <Route path="/employee/manager/goals" element={<TeamGoals />} />
          <Route path="/employee/manager/reviews" element={<PerformanceReviews />} />
          <Route path="/employee/manager/1on1" element={<OneOnOneMeetings />} />
          <Route path="/employee/manager/reimbursements" element={<AdminReimbursements />} />
          <Route path="/employee/manager/feedback" element={<TeamFeedback />} />
          <Route path="/employee/manager/payroll" element={<TeamPayrollSummary />} />
          <Route path="/employee/manager/interviews" element={<InterviewSchedule />} />
          <Route path="/employee/manager/candidate-feedback" element={<CandidateFeedback />} />
          <Route path="/employee/manager/requisitions" element={<JobRequisitions />} />
          <Route path="/employee/manager/assets" element={<TeamAssets />} />
          <Route path="/employee/manager/expenses" element={<TeamExpenses />} />
          <Route path="/employee/manager/reports/team" element={<TeamReports />} />
            <Route path="/employee/manager/reports/attendance" element={<AttendanceReports />} />
            <Route path="/employee/manager/reports/leave" element={<LeaveReports />} />
            <Route path="/employee/manager/reports/productivity" element={<ProductivityReports />} />
          </Route>

          {/* Fallbacks */}
          <Route path="/employee/attendance" element={<EmployeeAttendance />} />
          <Route path="/employee/attendance/corrections" element={<AttendanceCorrections />} />
          <Route path="/employee/leaves" element={<EmployeeLeaves />} />
          <Route path="/employee/projects" element={<EmployeeProjects />} />
          <Route path="/employee/tasks" element={<EmployeeProjects />} />
          <Route path="/employee/timesheets" element={<div className="p-8 text-heading">Employee Timesheets View</div>} />
          <Route path="/employee/payslips" element={<EmployeePayslips />} />
          <Route path="/employee/documents" element={<EmployeeDocuments />} />
          <Route path="/employee/assets" element={<div className="p-8 text-heading">Employee Assets View</div>} />
          <Route path="/employee/pre-joining" element={<PreJoiningPortal />} />

          {/* Fallback Legacy Routes Redirects */}
          <Route path="/my-portal" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="/create-org" element={<Register />} />
        </Route>

        {/* Super Admin Routes */}
        <Route element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/organizations" element={<Organizations />} />
          <Route path="/superadmin/plans" element={<SubscriptionPlans />} />
          <Route path="/superadmin/usage" element={<PlatformUsage />} />
          <Route path="/superadmin/health" element={<SystemHealth />} />
          <Route path="/superadmin/jobs" element={<BackgroundJobs />} />
          <Route path="/superadmin/tickets" element={<SupportTickets />} />
          <Route path="/superadmin/audit" element={<div className="p-8 text-secondary">Audit logs module coming soon</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
