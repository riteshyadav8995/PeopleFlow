import React from 'react';
import { X, Download } from 'lucide-react';
import type { Payslip } from '../../../services/payroll.service';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import './PayslipViewer.css';

interface PayslipViewerProps {
  payslip: Payslip;
  onClose: () => void;
  companyName?: string;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'];

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export function PayslipViewer({ payslip, onClose, companyName = 'PeopleFlow Inc.' }: PayslipViewerProps) {
  const handleDownload = () => {
    const element = document.getElementById('payslip-print-area');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${months[payslip.month - 1]}_${payslip.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const allowances = payslip.breakdown?.allowances || [];
  const deductions = payslip.breakdown?.deductions || [];

  return (
    <div className="payslip-viewer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="payslip-viewer-wrapper">
        {/* Toolbar */}
        <div className="viewer-toolbar">
          <span className="viewer-toolbar-title">
            Payslip — {months[payslip.month - 1]} {payslip.year}
          </span>
          <div className="viewer-toolbar-actions">
            <button className="btn-print" onClick={handleDownload}>
              <Download size={16} /> Download PDF
            </button>
            <button className="btn-close-viewer" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Payslip Document */}
        <div className="payslip-document" id="payslip-print-area">
          {/* Header */}
          <div className="payslip-doc-header">
            <div>
              <div className="company-name">{companyName}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Human Resources Department
              </div>
            </div>
            <div>
              <div className="payslip-doc-title">PAYSLIP</div>
              <div className="payslip-period">
                {months[payslip.month - 1]} {payslip.year}
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="payslip-employee-info">
            <div className="emp-info-row">
              <span className="emp-info-label">Employee</span>
              <span className="emp-info-value">
                {payslip.employee?.firstName} {payslip.employee?.lastName}
              </span>
            </div>
            <div className="emp-info-row">
              <span className="emp-info-label">Emp. Code</span>
              <span className="emp-info-value">{payslip.employee?.employeeCode || '—'}</span>
            </div>
            <div className="emp-info-row">
              <span className="emp-info-label">Designation</span>
              <span className="emp-info-value">{payslip.employee?.designation?.title || '—'}</span>
            </div>
            <div className="emp-info-row">
              <span className="emp-info-label">Department</span>
              <span className="emp-info-value">{payslip.employee?.department?.name || '—'}</span>
            </div>
            <div className="emp-info-row">
              <span className="emp-info-label">Pay Period</span>
              <span className="emp-info-value">{months[payslip.month - 1]} {payslip.year}</span>
            </div>
            <div className="emp-info-row">
              <span className="emp-info-label">Status</span>
              <span className="emp-info-value" style={{ textTransform: 'capitalize' }}>
                {payslip.status}
              </span>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="payslip-earnings-deductions">
            {/* Earnings */}
            <div>
              <div className="ed-section-title earnings">Earnings</div>
              <table className="ed-table">
                <tbody>
                  <tr>
                    <td className="ed-label">Basic Salary</td>
                    <td className="ed-amount">{fmt(payslip.baseSalary)}</td>
                  </tr>
                  {allowances.map((item, i) => (
                    <tr key={i}>
                      <td className="ed-label">{item.name}</td>
                      <td className="ed-amount">{fmt(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="ed-total">
                    <td>Gross Earnings</td>
                    <td className="ed-amount" style={{ color: 'var(--success)' }}>
                      {fmt(payslip.baseSalary + payslip.totalAllowances)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <div className="ed-section-title deductions">Deductions</div>
              <table className="ed-table">
                <tbody>
                  {deductions.length > 0 ? deductions.map((item, i) => (
                    <tr key={i}>
                      <td className="ed-label">{item.name}</td>
                      <td className="ed-amount">{fmt(item.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="ed-label" colSpan={2} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                        No deductions
                      </td>
                    </tr>
                  )}
                  <tr className="ed-total">
                    <td>Total Deductions</td>
                    <td className="ed-amount" style={{ color: 'var(--danger)' }}>
                      {fmt(payslip.totalDeductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Pay */}
          <div className="payslip-net-pay-box">
            <div>
              <div className="net-pay-label">Net Take Home Pay</div>
              <div className="net-pay-amount">{fmt(payslip.netPay)}</div>
            </div>
            <div className="net-pay-status">{payslip.status}</div>
          </div>

          {/* Footer */}
          <div className="payslip-footer">
            This is a computer-generated payslip and does not require a signature. •
            Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
