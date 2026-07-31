import React, { useState } from 'react';
import { Plus, Search, Filter, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import './SupportTickets.css';

export function SupportTickets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tickets = [
    { id: 'TKT-1042', subject: 'Laptop battery draining fast', category: 'IT Support', priority: 'High', status: 'In Progress', date: '2024-11-20' },
    { id: 'TKT-1041', subject: 'Tax deduction query', category: 'Payroll', priority: 'Medium', status: 'Resolved', date: '2024-11-15' },
    { id: 'TKT-1038', subject: 'Need access to AWS console', category: 'IT Support', priority: 'High', status: 'Resolved', date: '2024-11-10' },
    { id: 'TKT-1045', subject: 'Update home address in records', category: 'HR', priority: 'Low', status: 'Open', date: '2024-11-22' },
  ];

  const filteredTickets = tickets.filter(tkt => {
    const matchesSearch = tkt.subject.toLowerCase().includes(searchTerm.toLowerCase()) || tkt.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || tkt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Resolved': return <span className="status-badge resolved">Resolved</span>;
      case 'In Progress': return <span className="status-badge progress">In Progress</span>;
      case 'Open': return <span className="status-badge open">Open</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'High': return <span className="priority-badge high">High</span>;
      case 'Medium': return <span className="priority-badge medium">Medium</span>;
      case 'Low': return <span className="priority-badge low">Low</span>;
      default: return null;
    }
  };

  return (
    <div className="support-tickets-container page-container">
      <div className="tickets-header">
        <div>
          <h1 className="tickets-title">Support Tickets</h1>
          <p className="tickets-subtitle">Raise and track your IT, HR, and Payroll support requests.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="tickets-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tickets..." 
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
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="tickets-table-card">
        <div className="table-wrapper">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((tkt) => (
                <tr key={tkt.id}>
                  <td className="td-id">{tkt.id}</td>
                  <td className="td-subject">{tkt.subject}</td>
                  <td className="td-category">{tkt.category}</td>
                  <td>{getPriorityBadge(tkt.priority)}</td>
                  <td className="td-date">{tkt.date}</td>
                  <td>{getStatusBadge(tkt.status)}</td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={6}>
                    No tickets found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Create Support Ticket</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" placeholder="Brief summary of the issue" className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select">
                    <option>IT Support</option>
                    <option>HR</option>
                    <option>Payroll</option>
                    <option>Facilities</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={4} placeholder="Detailed explanation of the issue..." className="form-textarea"></textarea>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => { alert('Ticket created!'); setIsModalOpen(false); }} 
                className="btn-primary"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
