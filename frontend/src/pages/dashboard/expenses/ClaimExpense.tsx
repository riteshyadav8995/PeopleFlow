import React from 'react';
import { Plus, FileText, UploadCloud, AlertCircle } from 'lucide-react';
import './ClaimExpense.css';

export function ClaimExpense() {
  return (
    <div className="claim-expense-container page-container">
      <div className="claim-header">
        <h1 className="claim-title">Claim Expense</h1>
        <p className="claim-subtitle">Submit a new expense claim for reimbursement.</p>
      </div>

      <div className="claim-card">
        <form className="claim-form">
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select className="form-select">
                <option>Travel</option>
                <option>Food & Beverage</option>
                <option>Hotel Accommodation</option>
                <option>Fuel</option>
                <option>Office Supplies</option>
                <option>Medical</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Expense *</label>
              <input type="date" className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (INR) *</label>
            <input type="number" placeholder="0.00" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea rows={3} placeholder="Provide details about this expense..." className="form-textarea"></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Upload Receipts *</label>
            <div className="upload-zone">
              <UploadCloud size={32} className="upload-icon" />
              <div className="upload-text">
                <span className="upload-highlight">Click to upload</span> or drag and drop
                <div className="upload-hint">PDF, JPG, or PNG (max. 10MB)</div>
              </div>
            </div>
          </div>

          <div className="warning-banner">
            <AlertCircle size={20} className="warning-icon" />
            <p className="warning-text">
              Please ensure all details are accurate. False claims are a violation of company policy. Expense claims will be routed to your reporting manager for approval.
            </p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary">
              Cancel
            </button>
            <button type="button" className="btn-primary">
              <Plus size={18} /> Submit Claim
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
