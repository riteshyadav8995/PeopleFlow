import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { UserCheck, ChevronDown, Calendar, Download, Filter } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Attendance.css';

export function Attendance() {
  const { user } = useAuthStore();
  const orgId = user?.tenantId || 'demo-org-id';
  const [dateRange] = useState('Last 30 Days');

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['orgAttendanceStats', orgId],
    queryFn: () => attendanceService.getOrgDashboardStats(orgId)
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['orgAttendanceTrends', orgId],
    queryFn: () => attendanceService.getOrgTrends(orgId)
  });

  const { data: exceptions, isLoading: loadingExceptions } = useQuery({
    queryKey: ['orgAttendanceExceptions', orgId],
    queryFn: () => attendanceService.getOrgExceptions(orgId)
  });

  return (
    <div className="attendance-container page-container">
      {/* Header */}
      <div className="attendance-header">
        <div>
          <h1 className="attendance-title">Attendance Overview</h1>
          <p className="attendance-subtitle">Analyze organization-wide attendance trends and resolve exceptions.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Calendar size={16} /> {dateRange} <ChevronDown size={16} />
          </button>
          <button className="btn-secondary">
            <Filter size={16} /> Departments
          </button>
          <button className="btn-primary">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {loadingStats ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner />
        </div>
      ) : (
        <div className="attendance-stats-grid">
          <StatCard title="Total Employees" value={stats?.totalEmployees || 0} change="+2.4%" trend="up" />
          <StatCard title="Present Today" value={stats?.presentToday || 0} change="+1.2%" trend="up" />
          <StatCard title="Absent" value={stats?.absent || 0} change="-5.4%" trend="down" />
          <StatCard title="Late Arrivals" value={stats?.lateArrivals || 0} change="+0.8%" trend="up" />
        </div>
      )}

      {/* Content Grid */}
      <div className="attendance-content-grid">
        {/* Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Attendance Trends (30 Days)</h3>
          </div>
          <div style={{ width: '100%', height: '350px' }}>
            {loadingTrends ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--bg-surface)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                    labelStyle={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="present" name="Present" stroke="var(--success)" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="late" name="Late In" stroke="var(--warning)" strokeWidth={2.5} dot={false} strokeDasharray="6 4" />
                  <Line type="monotone" dataKey="absent" name="Absent" stroke="var(--danger)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Exceptions */}
        <div className="exceptions-card">
          <div className="exceptions-card-header">
            <h3 className="exceptions-card-title">Pending Exceptions</h3>
            <span className="badge-danger">{exceptions?.length || 0}</span>
          </div>

          {loadingExceptions ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Spinner />
            </div>
          ) : exceptions?.length === 0 ? (
            <div className="exceptions-empty">
              <div className="exceptions-empty-icon">
                <UserCheck size={32} />
              </div>
              <h4 className="exceptions-empty-title">All caught up!</h4>
              <p className="exceptions-empty-desc">No pending exceptions require your attention today.</p>
            </div>
          ) : (
            <div style={{ flex: 1, maxHeight: '350px', overflowY: 'auto' }}>
              <table className="exceptions-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Issue</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions?.map((exc: any) => (
                    <tr key={exc.id}>
                      <td>
                        <p className="exc-name">{exc.employee.firstName} {exc.employee.lastName}</p>
                        <p className="exc-date">{new Date(exc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </td>
                      <td>
                        <span className="badge-danger">Missed Punch</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-resolve">Resolve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend }: { title: string, value: number | string, change: string, trend: 'up' | 'down' }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{title}</p>
      <div className="stat-bottom">
        <p className="stat-value">{value}</p>
        <div className={`stat-badge ${trend}`}>
          {trend === 'up' ? (
            <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {change}
        </div>
      </div>
    </div>
  );
}
