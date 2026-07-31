import { Building2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function LeaveDepartmentSummary({ data, loading }: { data: any[]; loading: boolean }) {
  // Ensure we have valid data before rendering
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <div>
          <h3 className="leave-card-title">Department Summary</h3>
          <p className="leave-card-subtitle">Overview of leaves across all departments</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center flex-1 p-12"><Spinner /></div>
      ) : safeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
          <p className="text-muted">No department data available.</p>
        </div>
      ) : (
        <div className="leave-table-container">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Employees</th>
                <th>On Leave Today</th>
                <th>Upcoming Leaves (7 Days)</th>
                <th>Avg. Leave Balance</th>
                <th>Leave Utilization</th>
              </tr>
            </thead>
            <tbody>
              {safeData.map((dept, index) => (
                <tr key={index}>
                  <td>
                    <div className="leave-employee-cell">
                      <div className="leave-avatar" style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}>
                        <Building2 size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.departmentName}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{dept.totalEmployees}</td>
                  <td>
                    <span className="leave-badge leave-badge-warning">{dept.onLeaveToday}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{dept.upcomingLeaves}</td>
                  <td style={{ fontWeight: 500 }}>{dept.averageBalance} Days</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, background: 'var(--border-color)', height: '0.375rem', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            borderRadius: 'var(--radius-full)',
                            background: dept.utilization > 80 ? 'var(--danger)' : dept.utilization > 50 ? 'var(--warning)' : 'var(--brand-500)',
                            width: `${Math.min(100, Math.max(0, dept.utilization || 0))}%` 
                          }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '2.5rem', textAlign: 'right' }}>
                        {dept.utilization}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
