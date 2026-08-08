import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { 
  Users, Briefcase, Calendar, Clock, TrendingUp, AlertCircle, 
  CheckCircle, Activity, UserPlus, DollarSign, LayoutTemplate, AlertTriangle, X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import './Overview.css';


export function Overview() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['org-dashboard-stats'],
    queryFn: () => dashboardService.getOrganizationDashboardStats()
  });

  const { data: approvalsData, isLoading: approvalsLoading } = useQuery({
    queryKey: ['org-dashboard-approvals'],
    queryFn: () => dashboardService.getOrganizationApprovals()
  });

  const generateReportMutation = useMutation({
    mutationFn: dashboardService.generateOrganizationReport,
    onSuccess: () => {
      setSuccessMsg('Report generated successfully! Check your email.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: () => {
      alert('Failed to generate report. Please try again later.');
    }
  });

  const loading = statsLoading || approvalsLoading;
  const approvals = approvalsData || [];
  
  const attendanceRate = stats?.activeEmployees 
    ? ((stats.presentToday / stats.activeEmployees) * 100).toFixed(1) 
    : 0;

  return (
    <div className="overview-container">
      {successMsg && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, background: '#10b981', color: 'white', padding: '1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s ease-out' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
      {/* Row 1: Greeting & Actions */}
      <div className="overview-header">
        <div>
          <h1 className="overview-title">
            Good morning, {user?.firstName}!
          </h1>
          <p className="overview-subtitle">Here's your organization overview for today.</p>
        </div>
        <div className="overview-actions">
          <Button variant="secondary" style={{ display: 'flex', gap: '0.5rem' }} onClick={() => alert("Date range filter opened!")}>
            <Calendar size={16} /> Last 30 Days
          </Button>
          <Button 
            style={{ background: 'var(--brand-600)', color: '#fff', boxShadow: '0 0 15px rgba(99,102,241,0.3)' }} 
            onClick={() => generateReportMutation.mutate()}
            isLoading={generateReportMutation.isPending}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Row 2: 8 KPI Cards */}
      <div className="kpi-grid">
        {[
          { label: 'Total Staff', value: stats?.totalStaff ?? 0, icon: Users, color: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
          { label: 'Present Today', value: stats?.presentToday ?? 0, icon: CheckCircle, color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'On Leave', value: stats?.onLeave ?? 0, icon: Calendar, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
          { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: Clock, color: '#fb7185', bg: 'rgba(244, 63, 94, 0.1)' },
          { label: 'Open Jobs', value: stats?.openJobs ?? 0, icon: Briefcase, color: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)' },
          { label: 'Onboarding', value: stats?.onboarding ?? 0, icon: UserPlus, color: '#22d3ee', bg: 'rgba(6, 182, 212, 0.1)' },
          { label: 'Active Projects', value: stats?.activeProjects ?? 0, icon: LayoutTemplate, color: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
          { label: 'Overdue Tasks', value: stats?.overdueTasks ?? 0, icon: AlertTriangle, color: '#fb923c', bg: 'rgba(249, 115, 22, 0.1)' },
        ].map((kpi, i) => (
          <Card key={i} className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ background: kpi.bg, color: kpi.color }}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="kpi-label">{kpi.label}</p>
              <h3 className="kpi-value">{loading ? '-' : kpi.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Row 3: Trends & Attendance */}
      <div className="dashboard-row">
        <Card>
          <div className="section-header">
            <h3 className="section-title">
              <TrendingUp size={20} color="#818cf8" /> Headcount Trend
            </h3>
            <Button variant="secondary" size="sm" onClick={() => setIsDetailsModalOpen(true)}>Details</Button>
          </div>
          <div style={{ height: '12rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem', padding: '0 0.5rem' }}>
            {(stats?.attendanceTrend || Array.from({length: 7}).map(() => ({ present: 0, totalStaff: 1 }))).map((day: any, i: number) => {
              const h = day.totalStaff > 0 ? (day.present / day.totalStaff) * 100 : 0;
              return (
                <div key={i} title={day.date ? `${day.date}: ${day.present} present` : ''} style={{ width: '100%', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '0.125rem 0.125rem 0 0', transition: 'all 0.2s', height: `${loading ? 0 : Math.max(0, Math.min(100, h))}%` }}></div>
              );
            })}
          </div>
        </Card>
        
        <Card>
          <div className="section-header">
            <h3 className="section-title">
              <Activity size={20} color="#34d399" /> Today's Attendance
            </h3>
            <span style={{ fontSize: '0.875rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.375rem' }}>{attendanceRate}% Rate</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '10rem' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8rem', height: '8rem', borderRadius: '50%', border: '8px solid rgba(31, 41, 55, 1)', borderTopColor: '#10b981', borderRightColor: '#10b981', margin: '0 auto 0.5rem', position: 'relative' }}>
                   <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#000000' }}>{loading ? '-' : (stats?.presentToday || 0)}</span>
                </div>
                Present out of {loading ? '-' : (stats?.activeEmployees || 0)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Approvals & Recruitment */}
      <div className="dashboard-row">
        <Card style={{ height: '20rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="section-title" style={{ marginBottom: '1rem' }}>
            <CheckCircle size={20} color="#fb7185" /> Pending Approvals
          </h3>
          <div className="approvals-list">
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Loading approvals...</div>
            ) : approvals.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>All caught up! No pending approvals.</div>
            ) : (
              approvals.map((approval: any) => (
                <div key={approval.id} className="approval-item">
                  <div className="approval-info">
                    <div className="approval-avatar">
                      {approval.requester.charAt(0)}
                    </div>
                    <div>
                      <p className="approval-type">{approval.type}</p>
                      <p className="approval-desc">{approval.requester} • {approval.details}</p>
                    </div>
                  </div>
                  <div className="approval-actions">
                    <Button size="sm" variant="secondary" style={{ color: '#fb7185', borderColor: 'rgba(251, 113, 133, 0.2)' }}>Reject</Button>
                    <Button size="sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Approve</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card style={{ height: '20rem' }}>
          <h3 className="section-title">
            <Briefcase size={20} color="#c084fc" /> Recruitment Pipeline
          </h3>
          <div className="pipeline-container">
            {(() => {
              const pipe = loading ? { applied: 0, screening: 0, interview: 0, offer: 0 } : (stats?.recruitmentPipeline || { applied: 0, screening: 0, interview: 0, offer: 0 });
              const maxVal = Math.max(pipe.applied, pipe.screening, pipe.interview, pipe.offer, 1);
              return [
                { label: 'Applied', val: pipe.applied, h: `${(pipe.applied / maxVal) * 100}%` },
                { label: 'Screening', val: pipe.screening, h: `${(pipe.screening / maxVal) * 100}%` },
                { label: 'Interview', val: pipe.interview, h: `${(pipe.interview / maxVal) * 100}%` },
                { label: 'Offer', val: pipe.offer, h: `${(pipe.offer / maxVal) * 100}%` },
              ].map(stage => (
                <div key={stage.label} className="pipeline-stage">
                  <div className="pipeline-val">{loading ? '-' : stage.val}</div>
                  <div className="pipeline-bar" style={{ height: loading ? 0 : stage.h, minHeight: (stage.val > 0 && !loading) ? '5%' : '0' }}></div>
                  <div className="pipeline-label">{stage.label}</div>
                </div>
              ));
            })()}
          </div>
        </Card>
      </div>

      {/* Row 5: Onboarding & Payroll (Simplified) */}
      <div className="dashboard-row">
        <Card className="callout-card">
           <UserPlus size={32} color="#22d3ee" style={{ marginBottom: '0.75rem' }} />
           <h3 className="callout-value">{stats?.onboarding || 0} Active Onboardings</h3>
           <p className="callout-desc">Track progress of new hires.</p>
           <Button variant="secondary" onClick={() => navigate('/organization/onboarding')}>View Onboarding Dashboard</Button>
        </Card>
        <Card className="callout-card">
           <DollarSign size={32} color="#818cf8" style={{ marginBottom: '0.75rem' }} />
           <h3 className="callout-value">Current Payroll Cycle</h3>
           <p className="callout-desc">July 2026 • Closes in 4 days</p>
           <Button variant="secondary" onClick={() => navigate('/organization/payroll')}>Go to Payroll</Button>
        </Card>
      </div>

      {/* Row 8: Recent Activity */}
      <Card>
        <h3 className="section-title">
          <AlertCircle size={20} color="#94a3b8" /> Organization Activity
        </h3>
        <div style={{ marginTop: '1rem' }}>
          {loading ? (
            <div className="empty-state">Loading activity...</div>
          ) : (
            <div className="empty-state">
              No recent alerts or activity in your organization.
            </div>
          )}
        </div>
      </Card>

      {/* Headcount Details Modal */}
      {isDetailsModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Headcount & Attendance Trend (Last 7 Days)</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-secondary)" />
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Total Staff</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Present</th>
                    <th style={{ padding: '0.75rem 1rem' }}>On Leave</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.attendanceTrend?.length ? stats.attendanceTrend.map((day: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{day.date}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{day.totalStaff}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#10b981', fontWeight: 600 }}>{day.present}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#f59e0b' }}>{day.onLeave}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No attendance data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
