import React, { useState } from 'react';
import { UploadCloud, FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import './TaxDocuments.css';

export function TaxDocuments() {
  const [activeTab, setActiveTab] = useState<'declarations' | 'form16'>('declarations');

  const declarations = [
    { id: 1, section: '80C (Life Insurance, PPF, ELSS)', maxLimit: 150000, declared: 120000, status: 'Verified' },
    { id: 2, section: '80D (Medical Insurance)', maxLimit: 25000, declared: 15000, status: 'Verified' },
    { id: 3, section: 'HRA (Rent Receipts)', maxLimit: null, declared: 180000, status: 'Pending Review' },
    { id: 4, section: '80E (Education Loan Interest)', maxLimit: null, declared: 0, status: 'Not Declared' },
  ];

  return (
    <div className="tax-documents-container page-container">
      <div className="tax-header">
        <h1 className="tax-title">Tax Documents & Declarations</h1>
        <p className="tax-subtitle">Manage your IT declarations, investment proofs, and download Form 16.</p>
      </div>

      <div className="tax-tabs">
        <button 
          onClick={() => setActiveTab('declarations')}
          className={`tax-tab ${activeTab === 'declarations' ? 'active' : ''}`}
        >
          Investment Declarations
        </button>
        <button 
          onClick={() => setActiveTab('form16')}
          className={`tax-tab ${activeTab === 'form16' ? 'active' : ''}`}
        >
          Form 16
        </button>
      </div>

      {activeTab === 'declarations' && (
        <div className="declarations-section">
          <div className="announcement-banner">
            <div>
              <h3 className="announcement-title">FY 2024-25 Declarations Window is Open</h3>
              <p className="announcement-text">Please submit your investment proofs by March 15, 2025.</p>
            </div>
            <button className="btn-primary">
              Submit Proofs
            </button>
          </div>

          <div className="declarations-table-card">
            <div className="table-wrapper">
              <table className="declarations-table">
                <thead>
                  <tr>
                    <th>Section / Category</th>
                    <th>Max Limit</th>
                    <th>Amount Declared</th>
                    <th>Status</th>
                    <th className="th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {declarations.map(doc => (
                    <tr key={doc.id}>
                      <td className="td-section">{doc.section}</td>
                      <td className="td-limit">{doc.maxLimit ? `₹${doc.maxLimit.toLocaleString()}` : 'No Limit'}</td>
                      <td className="td-declared">₹{doc.declared.toLocaleString()}</td>
                      <td>
                        {doc.status === 'Verified' && (
                          <span className="status-badge verified">
                            <CheckCircle size={14} /> Verified
                          </span>
                        )}
                        {doc.status === 'Pending Review' && (
                          <span className="status-badge pending">
                            <AlertCircle size={14} /> Pending
                          </span>
                        )}
                        {doc.status === 'Not Declared' && (
                          <span className="status-badge none">
                            - None -
                          </span>
                        )}
                      </td>
                      <td className="td-action">
                        <button className="btn-link">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'form16' && (
        <div className="form16-grid">
          {[2024, 2023, 2022].map(year => (
            <div key={year} className="form16-card">
              <div className="form16-info">
                <div className="form16-icon">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="form16-title">Form 16</h3>
                  <p className="form16-year">Financial Year {year-1}-{year}</p>
                </div>
              </div>
              <button className="btn-download-full">
                <Download size={18} /> Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
