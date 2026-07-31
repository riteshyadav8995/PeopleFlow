import React, { useState } from 'react';
import { Clock, Search, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import './AttendanceCorrections.css';

export function AttendanceCorrections() {
  const [corrections, setCorrections] = useState([
    { id: '1', employee: 'Team Member 1', employeeId: 'EMP-001', role: 'Developer', date: new Date(Date.now() - 2*86400000).toISOString().split('T')[0], originalIn: '10:30 AM', originalOut: '07:00 PM', requestedIn: '09:30 AM', requestedOut: '07:00 PM', reason: 'Forgot to clock in early. Was present since 9:30 AM.', status: 'pending' },
    { id: '2', employee: 'Team Member 2', employeeId: 'EMP-002', role: 'Designer', date: new Date(Date.now() - 5*86400000).toISOString().split('T')[0], originalIn: '09:00 AM', originalOut: '04:00 PM', requestedIn: '09:00 AM', requestedOut: '06:00 PM', reason: 'System crashed at 4 PM, continued working until 6 PM.', status: 'pending' },
    { id: '3', employee: 'Team Member 3', employeeId: 'EMP-003', role: 'Engineer', date: new Date(Date.now() - 10*86400000).toISOString().split('T')[0], originalIn: '--:--', originalOut: '--:--', requestedIn: '10:00 AM', requestedOut: '06:30 PM', reason: 'WFH due to heavy rain, unable to access VPN.', status: 'approved' },
  ]);

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: action } : c));
    showSuccess(`Correction ${action}!`);
  };

  const pending = corrections.filter(c => c.status === 'pending');
  const history = corrections.filter(c => c.status !== 'pending');
  const displayed = (activeTab === 'pending' ? pending : history).filter(c =>
    c.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ac-container">
      {successMsg && <div className="tg-success-toast">{successMsg}</div>}

      <div className="oon-header">
        <div>
          <h1 className="oon-title"><Clock size={22} /> Attendance Corrections</h1>
          <p className="oon-subtitle">Review and approve/reject attendance correction requests from your team.</p>
        </div>
        <div className="ac-count-badge">{pending.length} Pending</div>
      </div>

      <div className="oon-tabs">
        <button className={`oon-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <AlertCircle size={14} /> Pending ({pending.length})
        </button>
        <button className={`oon-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <CheckCircle size={14} /> History ({history.length})
        </button>
      </div>

      <div className="ac-search-bar">
        <Search size={16} />
        <input type="text" placeholder="Search by employee name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="oon-list">
        {displayed.length === 0 && (
          <div className="goals-empty"><Clock size={40} strokeWidth={1} /><p>No {activeTab} corrections.</p></div>
        )}
        {displayed.map(c => (
          <div key={c.id} className="ac-card">
            <div className="ac-card-header">
              <div className="ac-card-employee">
                <div className="pr-avatar">{c.employee.charAt(0)}</div>
                <div>
                  <h3 className="oon-card-name">{c.employee}</h3>
                  <p className="oon-card-type">{c.role} • {c.employeeId}</p>
                </div>
              </div>
              <span className="oon-card-date"><Calendar size={12} /> {c.date}</span>
            </div>
            <div className="ac-time-comparison">
              <div className="ac-time-block ac-time-original">
                <span className="ac-time-label">Original</span>
                <span className="ac-time-value">{c.originalIn} → {c.originalOut}</span>
              </div>
              <div className="ac-time-arrow">→</div>
              <div className="ac-time-block ac-time-requested">
                <span className="ac-time-label">Requested</span>
                <span className="ac-time-value">{c.requestedIn} → {c.requestedOut}</span>
              </div>
            </div>
            <p className="ac-reason"><strong>Reason:</strong> {c.reason}</p>
            {c.status === 'pending' ? (
              <div className="ac-actions">
                <button className="ac-btn ac-btn-approve" onClick={() => handleAction(c.id, 'approved')}>
                  <CheckCircle size={14} /> Approve
                </button>
                <button className="ac-btn ac-btn-reject" onClick={() => handleAction(c.id, 'rejected')}>
                  <XCircle size={14} /> Reject
                </button>
              </div>
            ) : (
              <span className={`pr-status-badge ${c.status === 'approved' ? 'pr-status-completed' : 'pr-status-pending'}`}>
                {c.status === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
