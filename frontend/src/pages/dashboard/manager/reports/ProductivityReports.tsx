import React from 'react';
import { Activity, Download, CheckCircle, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';
import './ProductivityReports.css';

export function ProductivityReports() {
  const user = useAuthStore(state => state.user);
  const { data: productivity, isLoading, isError } = useQuery({
    queryKey: ['managerProductivity', user?.organizationId],
    queryFn: async () => {
      const response = await api.get('/dashboard/manager/productivity', {
        params: { organizationId: user?.organizationId }
      });
      return response.data.data;
    },
    enabled: !!user?.organizationId
  });

  if (isLoading) {
    return (
      <div className="prod-reports-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isError || !productivity) {
    return (
      <div className="prod-reports-container" style={{ textAlign: 'center', paddingTop: '4rem', color: '#6b7280' }}>
        <p>Failed to load productivity data. Please try again later.</p>
      </div>
    );
  }

  const { goalsCompleted, taskCompletionRate, avgVelocity, velocityTrend } = productivity;
  
  // Calculate max points for chart scaling, ensuring it's at least 10 to avoid division by zero or tiny bars
  const maxPts = Math.max(...velocityTrend, 10);

  const handleExport = () => {
    if (!productivity) return;
    
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Goals Completed', productivity.goalsCompleted],
      ['Task Completion Rate', `${productivity.taskCompletionRate}%`],
      ['Velocity (Last 30 Days)', `${productivity.avgVelocity} pts`],
      ['Velocity Trend (Week 1 to 6)', productivity.velocityTrend.join(', ')]
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `productivity_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="prod-reports-container ">
      <div className="pr-header">
        <div className="pr-title-wrapper">
          <h1 className="pr-title">
            <Activity className="pr-icon" size={24} />
            Productivity & Goals
          </h1>
          <p className="pr-subtitle">Measure team output, task completion rates, and goal achievements.</p>
        </div>
        <div className="pr-actions">
          <button className="pr-btn-export" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="pr-metrics-grid">
        <div className="pr-metric-card border-indigo">
          <div className="pr-metric-label">
            <Target size={16} /> Goals Completed
          </div>
          <div className="pr-metric-value">{goalsCompleted}</div>
          <div className="pr-metric-trend pr-trend-gray">Active goals marked completed</div>
        </div>
        <div className="pr-metric-card border-emerald">
          <div className="pr-metric-label">
            <CheckCircle size={16} /> Task Completion Rate
          </div>
          <div className="pr-metric-value">{taskCompletionRate}%</div>
          <div className="pr-metric-trend pr-trend-gray">Overall team completion</div>
        </div>
        <div className="pr-metric-card border-blue">
          <div className="pr-metric-label">
            <TrendingUp size={16} /> Velocity (Last 30 Days)
          </div>
          <div className="pr-metric-value">{avgVelocity} pts</div>
          <div className="pr-metric-trend pr-trend-gray">Total estimated hours completed</div>
        </div>
      </div>
      
      <div className="pr-chart-card">
        <h3 className="pr-chart-title">Team Velocity Trend (Last 6 Weeks)</h3>
        <div className="pr-chart-container">
          {velocityTrend.map((pts: number, i: number) => (
             <div key={i} className="pr-chart-bar-group">
               <span className="pr-chart-bar-tooltip">{pts} pts</span>
               <div 
                 className="pr-chart-bar" 
                 style={{ height: `${(pts / maxPts) * 100}%`, minHeight: pts > 0 ? '5%' : '0' }}
               ></div>
               <span className="pr-chart-bar-label">Week {i+1}</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
