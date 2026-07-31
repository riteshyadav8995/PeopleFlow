import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Search, Filter, Calendar, MapPin, CheckCircle, XCircle, AlertCircle, Download, Users } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import './TeamAttendance.css';

export function TeamAttendance() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const managerId = user?.employeeId;
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamic Date State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const dateObj = new Date(selectedDate);
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  // Fetch Attendance Records for the month
  const { data: attendance, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['teamAttendance', managerId, month, year],
    queryFn: async () => {
      const res = await api.get('/attendance', { 
        params: { organizationId, managerId, month, year } 
      });
      return res.data.data;
    },
    enabled: !!managerId && !!organizationId
  });

  // Fetch Team Members to calculate total size
  const { data: teamMembers, isLoading: isTeamLoading } = useQuery({
    queryKey: ['myTeam', managerId],
    queryFn: async () => {
      const res = await api.get('/employee', { 
        params: { organizationId, managerId } 
      });
      return res.data.data;
    },
    enabled: !!managerId && !!organizationId
  });

  const isLoading = isAttendanceLoading || isTeamLoading;

  // Filter attendance by selected date and search term
  const filteredAttendance = attendance?.filter((record: any) => {
    // Safely parse date and compare
    const recordDateStr = new Date(record.date).toISOString().split('T')[0];
    const matchesDate = recordDateStr === selectedDate;
    
    const name = `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.toLowerCase();
    const code = (record.employee?.employeeCode || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  }) || [];

  const formatTime = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'present':
        return <span className="status-badge present"><CheckCircle size={12} /> Present</span>;
      case 'absent':
        return <span className="status-badge absent"><XCircle size={12} /> Absent</span>;
      case 'late':
        return <span className="status-badge late"><AlertCircle size={12} /> Late</span>;
      case 'half_day':
        return <span className="status-badge half_day"><Clock size={12} /> Half Day</span>;
      default:
        return <span className="status-badge default">{status}</span>;
    }
  };

  const handleExport = () => {
    if (!filteredAttendance || filteredAttendance.length === 0) {
      alert("No attendance records to export for this date.");
      return;
    }
    
    const headers = ['Employee ID', 'Name', 'Date', 'Status', 'Clock In', 'Clock Out', 'Location'];
    const csvContent = [
      headers.join(','),
      ...filteredAttendance.map((record: any) => {
        const name = `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`;
        const date = new Date(record.date).toLocaleDateString();
        const clockIn = formatTime(record.clockInTime);
        const clockOut = formatTime(record.clockOutTime);
        return `${record.employee?.employeeCode || ''},"${name}",${date},${record.status},${clockIn},${clockOut},"${record.location || 'Office - HQ'}"`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `team_attendance_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic Metrics Calculation
  const totalTeamSize = teamMembers?.length || 0;
  const presentCount = filteredAttendance.filter((a:any) => a.status === 'present').length;
  const lateCount = filteredAttendance.filter((a:any) => a.status === 'late').length;
  const halfDayCount = filteredAttendance.filter((a:any) => a.status === 'half_day').length;
  
  // Calculate absences dynamically (total team - those who clocked in today, plus explicitly absent)
  // Note: Only calculate dynamic absence if viewing today's or a past date.
  const isFutureDate = new Date(selectedDate) > new Date();
  const recordedCount = presentCount + lateCount + halfDayCount;
  const explicitAbsent = filteredAttendance.filter((a:any) => a.status === 'absent').length;
  const estimatedAbsent = isFutureDate ? 0 : Math.max(0, totalTeamSize - recordedCount) + explicitAbsent;

  return (
    <div className="team-attendance-container">
      
      {/* Header section */}
      <div className="attendance-header">
        <div>
          <h1 className="attendance-title">
            <Clock color="var(--brand-600)" />
            Team Daily Attendance
          </h1>
          <p className="attendance-subtitle">Monitor daily attendance records for your team members.</p>
        </div>
        <div className="header-actions">
          <div className="date-badge" style={{ position: 'relative', overflow: 'hidden' }}>
            <Calendar size={20} color="var(--brand-600)" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--brand-700)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <button className="export-btn" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        {[
          { label: 'Total Team Size', value: totalTeamSize, icon: Users, variant: 'brand' },
          { label: 'Present', value: presentCount, icon: CheckCircle, variant: 'success' },
          { label: 'Late Arrivals', value: lateCount, icon: AlertCircle, variant: 'warning' },
          { label: 'Estimated Absent', value: estimatedAbsent, icon: XCircle, variant: 'danger' }
        ].map((metric, i) => (
          <div key={i} className="metric-card">
            <div className={`metric-icon-box ${metric.variant}`}>
              <metric.icon size={24} />
            </div>
            <div className="metric-info">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{isLoading ? '-' : metric.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="attendance-main-card">
        <div className="attendance-toolbar">
          <h2 className="toolbar-title">Attendance Roster</h2>
          
          <div className="toolbar-actions-row">
            <div className="search-container">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                placeholder="Search employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="filter-btn">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          {isLoading ? (
            <div className="loading-container">
              <Spinner />
            </div>
          ) : filteredAttendance?.length === 0 ? (
            <div className="empty-state">
              <Users size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
              <p>No attendance records found for {new Date(selectedDate).toLocaleDateString()}.</p>
            </div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance?.map((record: any) => (
                  <tr key={record.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {record.employee?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="employee-name">{record.employee?.firstName} {record.employee?.lastName}</div>
                          <div className="employee-id">{record.employee?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(record.status)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatTime(record.clockInTime)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatTime(record.clockOutTime)}</div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <MapPin size={14} />
                        {record.location || 'Office - HQ'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
