import React, { useState } from 'react';
import { Search, Filter, CheckCircle, Clock, XCircle, Download, FileText, Receipt, Edit, Upload } from 'lucide-react';
import './ExpenseHistory.css';

export function ExpenseHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [history, setHistory] = useState<{id: string; category: string; merchant: string; amount: number; date: string; status: string; receipt: boolean; receiptUrl?: string}[]>([
    { id: 'EXP-1045', category: 'Travel', merchant: 'Uber', amount: 850, date: '2024-11-20', status: 'Approved', receipt: true },
    { id: 'EXP-1044', category: 'Meals', merchant: 'Starbucks', amount: 320, date: '2024-11-18', status: 'Pending', receipt: true },
    { id: 'EXP-1043', category: 'Office Supplies', merchant: 'Amazon', amount: 1250, date: '2024-11-15', status: 'Approved', receipt: true },
    { id: 'EXP-1040', category: 'Software', merchant: 'Adobe', amount: 4500, date: '2024-11-10', status: 'Rejected', receipt: false },
    { id: 'EXP-1035', category: 'Travel', merchant: 'IndiGo Airlines', amount: 6500, date: '2024-10-25', status: 'Reimbursed', receipt: true },
  ]);

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

  const handleExportCSV = () => {
    const headers = ['Expense ID', 'Date', 'Category', 'Merchant', 'Amount', 'Status', 'Receipt Included'];
    const rows = history.map(item => [
      item.id,
      item.date,
      `"${item.category}"`,
      `"${item.merchant}"`,
      item.amount,
      item.status,
      item.receipt ? 'Yes' : 'No'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="expense-history-container page-container">
      <div className="history-header">
        <div>
          <h1 className="history-title">Expense History</h1>
          <p className="history-subtitle">View all your past expense claims and their current statuses.</p>
        </div>
        <button className="btn-export" onClick={handleExportCSV}>
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
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button className="btn-view-receipt" onClick={() => setSelectedReceipt(item.id)}>
                          <FileText size={16} className="icon" /> View
                        </button>
                        <button className="btn-view-receipt" onClick={() => setEditingReceipt(item.id)} style={{ background: 'none', border: '1px solid #e2e8f0', color: '#64748b' }}>
                          <Edit size={16} className="icon" /> Edit
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span className="receipt-missing">Missing</span>
                        <button className="btn-view-receipt" onClick={() => setEditingReceipt(item.id)} style={{ background: 'none', border: '1px solid #3b82f6', color: '#3b82f6' }}>
                          <Upload size={16} className="icon" /> Upload
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <button 
              onClick={() => setSelectedReceipt(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem' }}
            >
              <XCircle size={24} />
            </button>
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
              <Receipt size={24} color="#3b82f6" /> Receipt Document
            </h2>
            
            <div style={{ backgroundColor: '#f1f5f9', height: '400px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', overflow: 'hidden', position: 'relative' }}>
              {/* Dummy or Uploaded receipt image */}
              <img 
                src={history.find(h => h.id === selectedReceipt)?.receiptUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80"} 
                alt="Receipt" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div style={{ position: 'absolute', bottom: '1rem', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 500 }}>
                {selectedReceipt}
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
               <button className="btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>Download PDF</button>
               <button className="btn-primary" onClick={() => setSelectedReceipt(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Upload Modal */}
      {editingReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <button 
              onClick={() => { setEditingReceipt(null); setSelectedFile(null); }} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem' }}
            >
              <XCircle size={24} />
            </button>
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
              <Upload size={24} color="#3b82f6" /> Upload / Edit Receipt
            </h2>
            
            <label style={{ backgroundColor: selectedFile ? '#eff6ff' : '#f1f5f9', padding: '2rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${selectedFile ? '#3b82f6' : '#cbd5e1'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
              <input type="file" style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', left: 0, top: 0 }} onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }} />
              {selectedFile ? (
                <>
                  <FileText size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>{selectedFile.name}</p>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Click to change file</p>
                </>
              ) : (
                <>
                  <Upload size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: '#475569', fontWeight: 500, fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>Click or drag file to upload</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>Supports JPG, PNG, PDF (Max 5MB)</p>
                </>
              )}
            </label>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
               <button className="btn-secondary" onClick={() => { setEditingReceipt(null); setSelectedFile(null); }} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
               <button className="btn-primary" disabled={!selectedFile} onClick={() => {
                 if (selectedFile && editingReceipt) {
                   const fileUrl = URL.createObjectURL(selectedFile);
                   setHistory(history.map(item => item.id === editingReceipt ? { ...item, receipt: true, receiptUrl: fileUrl } : item));
                 }
                 setEditingReceipt(null);
                 setSelectedFile(null);
               }} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: selectedFile ? '#3b82f6' : '#94a3b8', color: 'white', border: 'none', cursor: selectedFile ? 'pointer' : 'not-allowed', fontWeight: 500 }}>Save Document</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
