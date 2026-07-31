import React, { useState } from 'react';
import { Search, Filter, CheckCircle, Clock, XCircle, Download, FileText, Receipt } from 'lucide-react';
import './ExpenseHistory.css';

export function ExpenseHistory() {
  const [searchTerm, setSearchTerm] = useState('');

  const history = [
    { id: 'EXP-1045', category: 'Travel', merchant: 'Uber', amount: 850, date: '2024-11-20', status: 'Approved', receipt: true },
    { id: 'EXP-1044', category: 'Meals', merchant: 'Starbucks', amount: 320, date: '2024-11-18', status: 'Pending', receipt: true },
    { id: 'EXP-1043', category: 'Office Supplies', merchant: 'Amazon', amount: 1250, date: '2024-11-15', status: 'Approved', receipt: true },
    { id: 'EXP-1040', category: 'Software', merchant: 'Adobe', amount: 4500, date: '2024-11-10', status: 'Rejected', receipt: false },
    { id: 'EXP-1035', category: 'Travel', merchant: 'IndiGo Airlines', amount: 6500, date: '2024-10-25', status: 'Reimbursed', receipt: true },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Reimbursed': 
      case 'Approved': 
        return <span className="status-badge success"><CheckCircle size={14} /> {status}</span>;
      case 'Pending': 
        return <span className="status-badge pending"><Clock size={14} /> Pending</span>;
      case 'Rejected': 
        return <span className="status-badge danger"><XCircle size={14} /> Rejected</span>;
      default: 
        return null;
    }
  };

  return (
    <div className="expense-history-container page-container">
      <div className="history-header">
        <div>
          <h1 className="history-title">Expense History</h1>
          <p className="history-subtitle">View all your past expense claims and their current statuses.</p>
        </div>
        <button className="btn-export">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="history-summary">
        <div className="summary-card">
          <div className="summary-label">Total Approved (This Month)</div>
          <div className="summary-value success">₹2,100</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Pending Approval</div>
          <div className="summary-value warning">₹320</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Reimbursed (YTD)</div>
          <div className="summary-value info">₹14,500</div>
        </div>
      </div>

      <div className="history-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search expenses by merchant or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn-filter">
          <Filter size={18} /> Filter
        </button>
      </div>

      <div className="history-table-card">
        <div className="table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Date</th>
                <th>Category & Merchant</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {history.filter(h => h.merchant.toLowerCase().includes(searchTerm.toLowerCase()) || h.id.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                <tr key={item.id}>
                  <td className="td-id">{item.id}</td>
                  <td className="td-date">{item.date}</td>
                  <td>
                    <div className="td-merchant">{item.merchant}</div>
                    <div className="td-category">{item.category}</div>
                  </td>
                  <td className="td-amount">₹{item.amount.toLocaleString()}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td className="td-action">
                    {item.receipt ? (
                      <button className="btn-view-receipt">
                        <FileText size={16} className="icon" /> View
                      </button>
                    ) : (
                      <span className="receipt-missing">Missing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
