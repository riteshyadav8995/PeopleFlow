import { LineChart as LineChartIcon, Filter } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function LeaveAnalyticsChart({ data, loading }: { data: any[]; loading: boolean }) {
  const chartData = data?.length > 0 ? data : [
    { month: 'Jan', total: 12, sick: 5, casual: 7 },
    { month: 'Feb', total: 15, sick: 8, casual: 7 },
    { month: 'Mar', total: 10, sick: 4, casual: 6 },
    { month: 'Apr', total: 18, sick: 10, casual: 8 },
    { month: 'May', total: 14, sick: 6, casual: 8 },
    { month: 'Jun', total: 20, sick: 12, casual: 8 }
  ];

  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <div>
          <h3 className="leave-card-title">Leave Trends</h3>
          <p className="leave-card-subtitle">Monthly leave application volume</p>
        </div>
      </div>
      <div style={{ padding: '1.5rem', flex: 1, height: '350px' }}>
        {loading ? (
          <div className="leave-spinner-container"><Spinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '0.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', padding: '0.75rem', fontSize: '0.875rem' }} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              <Line type="monotone" dataKey="total" name="Total Leaves" stroke="var(--brand-500)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-surface)' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="sick" name="Sick Leaves" stroke="var(--danger)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="casual" name="Casual Leaves" stroke="var(--warning)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
