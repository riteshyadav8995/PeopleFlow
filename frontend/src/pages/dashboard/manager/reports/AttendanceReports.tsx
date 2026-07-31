import React, { useState } from 'react';
import { Clock, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { attendanceService } from '@/services/attendance.service';
import { Spinner } from '@/components/ui/Spinner';
import './AttendanceReports.css';

export function AttendanceReports() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: report, isLoading } = useQuery({
    queryKey: ['attendanceReports', organizationId, selectedMonth, selectedYear],
    queryFn: () => attendanceService.getMonthlyReport(organizationId!, selectedMonth, selectedYear),
    enabled: !!organizationId
  });

  if (isLoading) {
    return <div className="flex justify-center p-10"><Spinner /></div>;
  }

  return (
    <div className="attendance-reports-container">
      <div className="ar-header">
        <div className="ar-title-wrapper">
          <h1 className="ar-title">
            <Clock className="ar-icon" size={24} />
            Attendance Reports
          </h1>
          <p className="ar-subtitle">Monthly insights into team attendance, late arrivals, and early departures.</p>
        </div>
        <div className="ar-actions">
          <select 
            className="ar-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })} {selectedYear}
              </option>
            ))}
          </select>
          <button className="ar-btn-export">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="ar-metrics-grid">
        <div className="ar-metric-card">
          <div className="ar-metric-label">Average Daily Attendance</div>
          <div className="ar-metric-value-wrapper">
            <div className="ar-metric-value">{report?.averageDailyAttendance || 0}%</div>
            <div className="ar-metric-trend ar-trend-up">
              <TrendingUp size={16} className="mr-1" /> 2.1%
            </div>
          </div>
        </div>
        <div className="ar-metric-card">
          <div className="ar-metric-label">Avg. Late Arrivals</div>
          <div className="ar-metric-value-wrapper">
            <div className="ar-metric-value">{report?.averageLateArrivals || 0}</div>
            <div className="ar-metric-unit">/ day</div>
            <div className="ar-metric-trend ar-trend-down">
              <TrendingDown size={16} className="mr-1" /> 0.3
            </div>
          </div>
        </div>
        <div className="ar-metric-card">
          <div className="ar-metric-label">Avg. Hours Logged</div>
          <div className="ar-metric-value-wrapper">
            <div className="ar-metric-value">{report?.averageHoursLogged || 0}</div>
            <div className="ar-metric-unit">hrs/day</div>
            <div className="ar-metric-trend ar-trend-up">
              <TrendingUp size={16} className="mr-1" /> 0.1
            </div>
          </div>
        </div>
      </div>

      <div className="ar-table-card">
        <div className="ar-table-header">
          <h3 className="ar-table-title">Monthly Attendance Breakdown</h3>
        </div>
        <div className="ar-table-wrapper">
          <table className="ar-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th style={{ textAlign: 'center' }}>Present Days</th>
                <th style={{ textAlign: 'center' }}>Absent Days</th>
                <th style={{ textAlign: 'center' }}>Late Arrivals</th>
                <th style={{ textAlign: 'center' }}>Early Departures</th>
                <th style={{ textAlign: 'right' }}>Avg. Hours</th>
              </tr>
            </thead>
            <tbody>
              {report?.breakdown?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No data available for this month.</td>
                </tr>
              )}
              {report?.breakdown?.map((row: any, i: number) => (
                <tr key={i}>
                  <td className="ar-td-emp">{row.name}</td>
                  <td className="ar-td-present">{row.present}</td>
                  <td className="ar-td-absent">{row.absent}</td>
                  <td className="ar-td-late">{row.late}</td>
                  <td className="ar-td-early">{row.early}</td>
                  <td className="ar-td-hours">{row.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
