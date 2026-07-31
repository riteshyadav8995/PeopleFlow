import React, { useState } from 'react';
import { Plus, Monitor, Laptop, Mouse, Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import './AssetRequests.css';

export function AssetRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const requests = [
    { id: 'REQ-A001', type: 'MacBook Pro M3', category: 'Laptop', requestedOn: '2024-11-25', status: 'Pending Approval', urgency: 'High' },
    { id: 'REQ-A002', type: 'Dell 27" 4K Monitor', category: 'Monitor', requestedOn: '2024-11-15', status: 'Approved', urgency: 'Medium' },
    { id: 'REQ-A003', type: 'Logitech MX Master 3S', category: 'Accessories', requestedOn: '2024-10-05', status: 'Delivered', urgency: 'Low' },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Delivered': 
      case 'Approved': 
        return <span className="status-badge success"><CheckCircle size={14} /> {status}</span>;
      case 'Pending Approval': 
        return <span className="status-badge pending"><Clock size={14} /> Pending</span>;
      default: 
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Laptop': return <Laptop size={18} color="var(--brand-500)" />;
      case 'Monitor': return <Monitor size={18} color="#8b5cf6" />;
      default: return <Mouse size={18} color="var(--warning)" />;
    }
  };

  return (
    <div className="asset-requests-container page-container">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Asset Requests</h1>
          <p className="requests-subtitle">Request new IT assets and track their delivery status.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} /> Request Asset
        </button>
      </div>

      <div className="requests-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search asset requests..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="requests-table-card">
        <div className="table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Asset Details</th>
                <th>Date</th>
                <th>Urgency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id}>
                  <td className="td-id">{item.id}</td>
                  <td>
                    <div className="asset-details-cell">
                      <div className="asset-icon-box">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="asset-type">{item.type}</div>
                        <div className="asset-category">{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-date">{item.requestedOn}</td>
                  <td>
                    <span className={`urgency-badge ${item.urgency.toLowerCase()}`}>
                      {item.urgency}
                    </span>
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Request New Asset</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Asset Category</label>
                <select className="form-select">
                  <option>Laptop</option>
                  <option>Monitor</option>
                  <option>Accessories (Mouse, Keyboard)</option>
                  <option>Mobile Device</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Specific Requirement (e.g. MacBook Pro M3)</label>
                <input type="text" placeholder="Specify make and model..." className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Business Justification</label>
                <textarea rows={3} placeholder="Why do you need this asset?" className="form-textarea"></textarea>
              </div>
            </div>

            <div className="modal-warning">
              <AlertTriangle size={20} className="modal-warning-icon" />
              <div className="modal-warning-text">
                All IT asset requests must be approved by your reporting manager and the IT department head. Delivery typically takes 3-5 business days after approval.
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
                onClick={() => { alert('Request submitted successfully!'); setIsModalOpen(false); }} 
                className="btn-primary"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
