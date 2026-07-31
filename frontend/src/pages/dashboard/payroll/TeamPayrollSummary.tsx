import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Search, Calendar, ChevronDown, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import './TeamPayrollSummary.css';

export function TeamPayrollSummary() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const managerId = user?.employeeId;
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['teamPayroll', managerId, selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await api.get('/payroll/payslips', { 
        params: { organizationId, managerId, month: selectedMonth, year: selectedYear } 
      });
      return res.data.data;
    },
    enabled: !!managerId && !!organizationId
  });

  const filteredPayslips = payslips?.filter((slip: any) => 
    `${slip.employee?.firstName} ${slip.employee?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.employee?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'processed':
      case 'paid':
        return <span className="badge badge-success"><CheckCircle2 size={14} /> {status.toUpperCase()}</span>;
      case 'draft':
      default:
        return <span className="badge badge-warning"><FileText size={14} /> DRAFT</span>;
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalNetPay = filteredPayslips?.reduce((sum: number, slip: any) => sum + Number(slip.netPay || 0), 0) || 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <div className="payroll-title-wrapper">
          <h1 className="payroll-title">
            <div className="payroll-icon-wrapper">
              <Banknote size={24} />
            </div>
            Team Payroll Summary
          </h1>
          <p className="payroll-subtitle">Review the monthly payroll summaries for your direct reports.</p>
        </div>
        
        <div className="payroll-filters">
          <div className="filter-select-wrapper">
            <Calendar className="filter-icon" size={16} />
            <select 
              className="filter-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown className="filter-dropdown-icon" size={16} />
          </div>
          <div className="filter-divider"></div>
          <div className="filter-select-wrapper">
            <select 
              className="filter-select"
              style={{ paddingLeft: '1rem' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="filter-dropdown-icon" size={16} />
          </div>
        </div>
      </div>

      <div className="payroll-overview">
        <div className="overview-card card-primary">
          <div className="card-glare"></div>
          <p className="card-label">Total Team Net Pay</p>
          <h2 className="card-value">{formatCurrency(totalNetPay)}</h2>
          <div className="card-badge">
            <Calendar size={12} />
            For {months[selectedMonth - 1]} {selectedYear}
          </div>
        </div>
        
        <div className="overview-card card-secondary">
          <div className="card-indicator"></div>
          <p className="card-label">Processed Payslips</p>
          <div className="card-value">
            {filteredPayslips?.filter((p: any) => p.status === 'processed' || p.status === 'paid').length || 0}
            <span className="card-value-total">/ {filteredPayslips?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="payroll-data-section">
        <div className="data-section-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text"
              placeholder="Search by employee name or ID..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-export">
            <Download size={18} />
            Export Summary
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--brand-500)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            </div>
            <h3 className="empty-title">Loading Payroll...</h3>
          </div>
        ) : filteredPayslips?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Banknote className="empty-icon" size={32} />
            </div>
            <h3 className="empty-title">No payroll data available</h3>
            <p className="empty-subtitle">There are no payslips generated for your team during {months[selectedMonth - 1]} {selectedYear}.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips?.map((slip: any) => {
                  const gross = (Number(slip.baseSalary) || 0) + (Number(slip.totalAllowances) || 0);
                  const deductions = Number(slip.totalDeductions) || 0;
                  const net = Number(slip.netPay) || 0;

                  return (
                    <tr key={slip.id} className="table-row">
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {slip.employee?.firstName?.charAt(0)}{slip.employee?.lastName?.charAt(0)}
                          </div>
                          <div className="employee-info">
                            <div className="employee-name">
                              {slip.employee?.firstName} {slip.employee?.lastName}
                            </div>
                            <div className="employee-id">ID: {slip.employee?.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="val-gross">
                        {formatCurrency(gross)}
                      </td>
                      <td className="val-deduction">
                        -{formatCurrency(deductions)}
                      </td>
                      <td className="val-net">
                        {formatCurrency(net)}
                      </td>
                      <td>
                        {getStatusBadge(slip.status)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-action" title="View Payslip">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
