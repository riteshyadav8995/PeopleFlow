import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import './MyLeaveRequests.css';

export function MyLeaveRequests() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const organizationId = user?.organizationId;

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['myLeaveRequests', organizationId],
    queryFn: async () => {
      const res = await api.get('/leave/my-requests', { params: { organizationId } });
      return res.data.data;
    },
    enabled: !!organizationId
  });

  const requests = requestsData || [];

  const filteredRequests = requests.filter((req: any) => {
    const typeName = req.leaveType?.name || '';
    const matchesSearch = typeName.toLowerCase().includes(searchTerm.toLowerCase()) || req.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    let mappedStatus = 'Pending';
    if (req.status === 'approved') mappedStatus = 'Approved';
    if (req.status === 'rejected') mappedStatus = 'Rejected';

    const matchesStatus = statusFilter === 'All' || mappedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Approved': return <CheckCircle size={14} />;
      case 'Pending': return <Clock size={14} />;
      case 'Rejected': return <XCircle size={14} />;
      default: return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Approved': return 'status-badge badge-success';
      case 'Pending': return 'status-badge badge-warning';
      case 'Rejected': return 'status-badge badge-danger';
      default: return 'status-badge badge-secondary';
    }
  };

  return (
    <div className="leave-requests-container page-container">
      <div className="requests-header">
        <h1 className="requests-title">My Leave Requests</h1>
        <p className="requests-subtitle">Track the status of your past and upcoming leave applications.</p>
      </div>

      <div className="requests-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by ID or type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-wrapper">
          <Filter size={18} className="filter-icon" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="requests-table-card">
        <div className="table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Applied On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req: any) => {
                let mappedStatus = 'Pending';
                if (req.status === 'approved') mappedStatus = 'Approved';
                if (req.status === 'rejected') mappedStatus = 'Rejected';

                return (
                  <tr key={req.id}>
                    <td className="td-id">{req.id.substring(0, 8).toUpperCase()}</td>
                    <td className="td-type">
                      {req.leaveType?.name}
                      {req.reason && <div className="type-reason">{req.reason}</div>}
                    </td>
                    <td className="td-duration">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="td-days">
                      {req.days} days
                    </td>
                    <td className="td-applied">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(mappedStatus)}>
                        {getStatusIcon(mappedStatus)} {mappedStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {isLoading ? 'Loading leave requests...' : 'No leave requests found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
