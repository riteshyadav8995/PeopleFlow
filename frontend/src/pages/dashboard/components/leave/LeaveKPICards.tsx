import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function LeaveKPICards({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  const cards = [
    {
      label: 'Pending Requests',
      value: stats?.pendingRequests ?? 0,
      icon: <Clock size={20} className="text-blue-500" />,
      bg: 'bg-blue-50',
      trend: stats?.pendingSinceYesterday ? `+${stats.pendingSinceYesterday} since yesterday` : null,
      trendUp: true
    },
    {
      label: 'Approved Today',
      value: stats?.approvedToday ?? 0,
      icon: <CheckCircle size={20} className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      trend: 'Normal volume',
      trendUp: true
    },
    {
      label: 'Rejected Today',
      value: stats?.rejectedToday ?? 0,
      icon: <XCircle size={20} className="text-red-500" />,
      bg: 'bg-red-50',
      trend: stats?.rejectedTrend ? `${stats.rejectedTrend}% from avg` : null,
      trendUp: false
    },
    {
      label: 'On Leave Today',
      value: stats?.onLeaveToday ?? 0,
      icon: <Users size={20} className="text-amber-500" />,
      bg: 'bg-amber-50',
      trend: stats?.onLeavePercentage ? `${stats.onLeavePercentage}% of workforce` : null,
      trendUp: false
    }
  ];

  return (
    <div className="leave-kpi-grid">
      {cards.map((card, index) => (
        <div key={index} className="leave-kpi-card">
          <div className="leave-kpi-header">
            <div className={`leave-kpi-icon ${card.bg}`}>
              {card.icon}
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trend</span>
          </div>
          <div>
            <p className="leave-kpi-value">{card.value}</p>
            <p className="leave-kpi-label">{card.label}</p>
          </div>
          {card.trend && (
            <div className={`leave-kpi-trend ${card.trendUp ? 'leave-trend-up' : 'leave-trend-neutral'}`}>
              {card.trend}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
