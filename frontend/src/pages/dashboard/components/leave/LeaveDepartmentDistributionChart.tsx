import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Spinner } from '@/components/ui/Spinner';

const COLORS = ['#1a73e8', '#00a650', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4'];

export function LeaveDepartmentDistributionChart({ data, loading }: { data: any[]; loading: boolean }) {
  const chartData = data?.length > 0 ? data : [
    { name: 'Engineering', value: 12 },
    { name: 'Design', value: 4 },
    { name: 'Marketing', value: 3 },
    { name: 'HR', value: 2 },
    { name: 'Sales', value: 5 }
  ];

  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <div>
          <h3 className="leave-card-title">Department Distribution</h3>
          <p className="leave-card-subtitle">Leave volume by team</p>
        </div>
      </div>
      <div style={{ padding: '1.5rem', flex: 1, minHeight: '300px' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full"><Spinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: 'var(--shadow-md)', padding: '0.75rem', fontSize: '0.875rem' }} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
