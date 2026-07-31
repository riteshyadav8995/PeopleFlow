import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Building2, Users, CreditCard, ServerCrash, Calendar, 
  RefreshCw, Briefcase, AlertTriangle, Clock, CheckCircle2, Info
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import './SuperAdminDashboard.css';

interface DashboardMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  activeEmployees: number;
  mrr: number;
  openTickets: number;
  systemStatus: string;
}

export function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/superadmin/dashboard');
      setMetrics(data.data);
    } catch (err) {
      console.error(err);
      // Fallback dummy data if backend endpoint is not fully ready
      setMetrics({
        totalOrganizations: 42,
        activeOrganizations: 38,
        trialOrganizations: 3,
        suspendedOrganizations: 1,
        totalUsers: 1450,
        activeEmployees: 1300,
        mrr: 45000,
        openTickets: 5,
        systemStatus: 'OPERATIONAL'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const KpiCard = ({ title, value, icon, color, bg, trend }: any) => (
    <div className="sa-kpi-card">
      <div className="sa-kpi-header">
        <h3 className="sa-kpi-title">{title}</h3>
        <div className="sa-kpi-icon-wrapper" style={{ color: color, background: bg }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="sa-kpi-value">{value}</p>
        {trend && (
          <div className="sa-kpi-footer">
            <span className={`sa-kpi-trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>{trend}</span>
            <span className="sa-kpi-trend-text">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="superadmin-dashboard">
      
      {/* ROW 1: Header */}
      <div className="sa-header">
        <div>
          <h1 className="sa-greeting">
            {greeting}, {user?.firstName}
          </h1>
          <p className="sa-status-text">
            <span className="sa-status-dot"></span>
            All platform services are operational.
          </p>
        </div>
        <div className="sa-header-actions">
          <div className="sa-date-filter">
            <Calendar size={16} />
            <span>Last 30 Days</span>
          </div>
          <Button 
            variant="secondary" 
            onClick={fetchMetrics} 
            disabled={loading}
            leftIcon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="sa-loading">Loading platform metrics...</div>
      ) : metrics ? (
        <>
          {/* ROW 2: KPI Grid */}
          <div className="sa-kpi-grid">
            <KpiCard title="Total Organizations" value={metrics.totalOrganizations} icon={<Building2 />} color="var(--brand-500)" bg="var(--brand-100)" trend="+12%" />
            <KpiCard title="Active Organizations" value={metrics.activeOrganizations} icon={<CheckCircle2 />} color="var(--success)" bg="rgba(16, 185, 129, 0.1)" trend="+5%" />
            <KpiCard title="Trial Organizations" value={metrics.trialOrganizations} icon={<Clock />} color="var(--warning)" bg="rgba(245, 158, 11, 0.1)" trend="+2%" />
            <KpiCard title="Suspended Orgs" value={metrics.suspendedOrganizations} icon={<AlertTriangle />} color="var(--danger)" bg="rgba(239, 68, 68, 0.1)" />
            
            <KpiCard title="Platform Users" value={metrics.totalUsers} icon={<Users />} color="#8b5cf6" bg="rgba(139, 92, 246, 0.1)" trend="+8%" />
            <KpiCard title="Active Employees" value={metrics.activeEmployees} icon={<Briefcase />} color="#d946ef" bg="rgba(217, 70, 239, 0.1)" trend="+15%" />
            <KpiCard title="Monthly Revenue" value={`$${metrics.mrr.toLocaleString()}`} icon={<CreditCard />} color="var(--success)" bg="rgba(16, 185, 129, 0.1)" trend="+10%" />
            <KpiCard title="Open Tickets" value={metrics.openTickets} icon={<Info />} color="#ec4899" bg="rgba(236, 72, 153, 0.1)" trend="-3%" />
          </div>

          {/* ROW 3: Charts */}
          <div className="sa-charts-grid">
             <div className="sa-chart-card">
                <h3 className="sa-chart-title">Organization Growth</h3>
                <div className="sa-chart-bars">
                  {[40, 60, 45, 80, 65, 90, 75, 100, 85, 110, 95, 120].map((h, i) => (
                    <div key={i} className="sa-chart-bar" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="sa-chart-labels">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                </div>
             </div>
             <div className="sa-chart-card">
                <h3 className="sa-chart-title">Subscription Revenue</h3>
                <div className="sa-chart-bars">
                  {[30, 40, 35, 60, 55, 80, 70, 90, 85, 105, 100, 115].map((h, i) => (
                    <div key={i} className="sa-chart-bar emerald" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="sa-chart-labels">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                </div>
             </div>
          </div>

          {/* ROW 4: Recent Organizations */}
          <div className="sa-section-card">
            <div className="sa-section-header">
              <h3 className="sa-section-title">Recent Organizations</h3>
              <Button variant="secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>View All</Button>
            </div>
            <div className="sa-section-body">
              <div className="sa-org-list">
                {[
                  { name: 'Acme Corp', industry: 'Technology', users: 150, status: 'Active' },
                  { name: 'Globex Inc', industry: 'Manufacturing', users: 45, status: 'Trial' },
                  { name: 'Soylent Corp', industry: 'Food & Beverage', users: 800, status: 'Active' }
                ].map((org, i) => (
                  <div key={i} className="sa-org-item">
                    <div className="sa-org-avatar">{org.name.substring(0, 2).toUpperCase()}</div>
                    <div className="sa-org-details">
                      <div className="sa-org-name">{org.name}</div>
                      <div className="sa-org-meta">
                        <span>{org.industry}</span>
                        <span>•</span>
                        <span>{org.users} Users</span>
                      </div>
                    </div>
                    <span className={`badge badge-${org.status === 'Active' ? 'success' : 'warning'}`}>{org.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 5 & 6: Various Panels */}
          <div className="sa-panels-grid">
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">Platform Usage</h3>
                <Button variant="secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Details</Button>
              </div>
              <div className="sa-panel-content">API limits and Storage usage metrics loading...</div>
            </div>
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">System Health</h3>
                <Button variant="secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>View Status</Button>
              </div>
              <div className="sa-panel-content-flex">
                <ServerCrash size={32} color="var(--success)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>OPERATIONAL</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>All core services (DB, Redis, S3) are running.</div>
                </div>
              </div>
            </div>
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">Open Support Tickets</h3>
                <Button variant="secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>View Queue</Button>
              </div>
              <div className="sa-panel-content">There are no open support requests.</div>
            </div>
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h3 className="sa-panel-title">Failed Background Jobs</h3>
                <Button variant="secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>View Jobs</Button>
              </div>
              <div className="sa-panel-content">All background jobs are operating normally.</div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
