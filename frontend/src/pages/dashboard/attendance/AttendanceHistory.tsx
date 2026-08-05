import React, { useState, useMemo } from 'react';
import { Calendar, Download, CheckCircle, XCircle, Clock, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { attendanceService } from '@/services/attendance.service';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';
import './AttendanceHistory.css';

export function AttendanceHistory() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || user?.tenantId || '';
  
  const [monthStr, setMonthStr] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [year, month] = monthStr.split('-').map(Number);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance', orgId, month, year],
    queryFn: () => attendanceService.getMyAttendance(orgId, month, year),
    enabled: !!orgId
  });

  const stats = useMemo(() => {
    let totalPresent = records.length;
    let lateMarks = 0;
    
    const recordsWithHours = records.filter((r: any) => r.totalHours && r.totalHours > 0);
    
    let avgHoursStr = '0h 0m';
    if (recordsWithHours.length > 0) {
      const totalHoursSum = recordsWithHours.reduce((sum: number, r: any) => sum + r.totalHours, 0);
      const avg = totalHoursSum / recordsWithHours.length;
      const h = Math.floor(avg);
      const m = Math.round((avg % 1) * 60);
      avgHoursStr = `${h}h ${m}m`;
    }

    records.forEach((r: any) => {
      if (r.clockInTime) {
        const d = new Date(r.clockInTime);
        if (d.getHours() > 9 || (d.getHours() === 9 && d.getMinutes() > 30)) {
          lateMarks++;
        }
      }
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    let weekends = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month - 1, i).getDay();
      if (d === 0 || d === 6) weekends++;
    }
    const totalAbsent = Math.max(0, daysInMonth - weekends - totalPresent);

    return { totalPresent, totalAbsent, lateMarks, avgHoursStr };
  }, [records, month, year]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'badge badge-success';
      case 'half day': return 'badge badge-warning';
      case 'absent': return 'badge badge-danger';
      case 'weekend': return 'badge badge-secondary';
      default: return 'badge badge-secondary';
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return format(new Date(dateStr), 'hh:mm a');
  };

  const formatHours = (hours: number | null) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="attendance-history-container page-container">
      <div className="history-header">
        <div>
          <h1 className="history-title">Attendance History</h1>
          <p className="history-subtitle">View your past clock-in and clock-out logs.</p>
        </div>
        
        <div className="history-controls">
          <div className="month-picker-wrapper">
            <Calendar size={18} color="var(--gray-500)" />
            <input 
              type="month" 
              value={monthStr}
              onChange={(e) => setMonthStr(e.target.value)}
              className="month-input"
            />
          </div>
          <button className="btn-export">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-present"><CheckCircle size={20} /></div>
          <div className="stat-label">Total Present: </div>
          <div className="stat-value val-present">{stats.totalPresent} Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-absent"><XCircle size={20} /></div>
          <div className="stat-label">Total Absent: </div>
          <div className="stat-value val-absent">{stats.totalAbsent} Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-late"><Clock size={20} /></div>
          <div className="stat-label">Late Marks: </div>
          <div className="stat-value val-late">{stats.lateMarks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-avg"><Briefcase size={20} /></div>
          <div className="stat-label">Avg. Working Hours: </div>
          <div className="stat-value val-avg">{stats.avgHoursStr}</div>
        </div>
      </div>

      <div className="history-table-card">
        {isLoading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : (
          <div className="table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      No attendance records found for this month.
                    </td>
                  </tr>
                ) : (
                  records.map((record: any, idx: number) => {
                    const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
                    const clockIn = formatTime(record.clockInTime);
                    const clockOut = formatTime(record.clockOutTime);
                    const hours = formatHours(record.totalHours);
                    const status = record.status || 'Present';
                    
                    let notes = 'On Time';
                    if (record.clockInTime) {
                      const d = new Date(record.clockInTime);
                      if (d.getHours() > 9 || (d.getHours() === 9 && d.getMinutes() > 30)) {
                        notes = 'Late In';
                      }
                      if (!record.clockOutTime && status === 'absent') {
                        notes = 'Single Punch';
                      }
                    }

                    return (
                      <tr key={idx}>
                        <td className="td-date">{dateStr}</td>
                        <td className={`td-time-in ${clockIn === '--' ? 'empty' : ''}`}>{clockIn}</td>
                        <td className={`td-time-out ${clockOut === '--' ? 'empty' : ''}`}>{clockOut}</td>
                        <td className="td-hours">{hours}</td>
                        <td>
                          <span className={getStatusColor(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="td-notes">{notes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
