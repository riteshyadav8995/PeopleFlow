import React from 'react';
import { Users, TrendingUp, BarChart, PieChart, Activity, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { employeeService } from '@/services/employee.service';
import { Spinner } from '@/components/ui/Spinner';
import './TeamReports.css';

export function TeamReports() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['teamMetrics', organizationId],
    queryFn: () => employeeService.getTeamMetrics(organizationId!),
    enabled: !!organizationId
  });

  if (isLoading) {
    return <div className="flex justify-center p-10"><Spinner /></div>;
  }

  const maxHeadcount = Math.max(
    ...(metrics?.headcountGrowth || []),
    metrics?.totalMembers || 1,
    14
  );

  return (
    <div className="team-reports-container">
      <div className="tr-header">
        <div className="tr-title-wrapper">
          <h1 className="tr-title">
            <BarChart className="tr-icon" size={24} />
            Team Reports & Analytics
          </h1>
          <p className="tr-subtitle">High-level overview of team composition, growth, and metrics.</p>
        </div>
        <div className="tr-actions">
          <button className="tr-btn-export">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="tr-metrics-grid">
        <div className="tr-metric-card">
          <div className="tr-metric-icon-box indigo"><Users size={24} /></div>
          <div className="tr-metric-content">
            <div className="tr-metric-label">Total Team Members</div>
            <div className="tr-metric-value">{metrics?.totalMembers || 0}</div>
          </div>
        </div>
        <div className="tr-metric-card">
          <div className="tr-metric-icon-box emerald"><Activity size={24} /></div>
          <div className="tr-metric-content">
            <div className="tr-metric-label">Avg. Tenure</div>
            <div className="tr-metric-value">{metrics?.avgTenureYears || 0} Yrs</div>
          </div>
        </div>
        <div className="tr-metric-card">
          <div className="tr-metric-icon-box amber"><TrendingUp size={24} /></div>
          <div className="tr-metric-content">
            <div className="tr-metric-label">Open Headcounts</div>
            <div className="tr-metric-value">{metrics?.openHeadcounts || 0}</div>
          </div>
        </div>
        <div className="tr-metric-card">
          <div className="tr-metric-icon-box red"><PieChart size={24} /></div>
          <div className="tr-metric-content">
            <div className="tr-metric-label">Team Attrition</div>
            <div className="tr-metric-value">{metrics?.attrition || 0}%</div>
          </div>
        </div>
      </div>

      <div className="tr-charts-grid">
        <div className="tr-chart-card">
          <div className="tr-chart-header">
            <h3 className="tr-chart-title">Headcount Growth</h3>
            <p className="tr-chart-subtitle">Last 12 months</p>
          </div>
          <div className="tr-bar-chart">
            {metrics?.headcountGrowth?.map((val: number, idx: number) => (
              <div 
                key={idx} 
                className="tr-bar" 
                style={{ height: `${(val / maxHeadcount) * 100}%` }}
              >
                <div className="tr-bar-tooltip">{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tr-chart-card">
          <div className="tr-chart-header">
            <h3 className="tr-chart-title">Team Composition</h3>
            <p className="tr-chart-subtitle">Active Members</p>
          </div>
          <div className="tr-donut-container">
            <div className="tr-donut">
              <div className="tr-donut-segment-1"></div>
              <div className="tr-donut-segment-2"></div>
              <div className="tr-donut-content">
                <div className="tr-donut-value">{metrics?.totalMembers || 0}</div>
                <div className="tr-donut-label">Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
