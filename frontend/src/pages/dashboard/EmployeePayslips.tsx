import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Download, FileText, Search } from 'lucide-react';
import { PayslipViewer } from './payroll/PayslipViewer';
import './EmployeePayslips.css';

export function EmployeePayslips() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || '';
  const [selectedPayslip, setSelectedPayslip] = React.useState<any>(null);

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['myPayslips', orgId],
    queryFn: async () => {
      const res = await api.get('/payroll/payslips', { params: { organizationId: orgId, employeeId: user?.employeeId } });
      return res.data.data;
    },
    enabled: !!orgId && !!user?.employeeId
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner /></div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="payslips-container page-container">
      <div className="payslips-header">
        <div>
          <h1 className="payslips-title">My Payslips</h1>
          <p className="payslips-subtitle">View and download your monthly salary slips.</p>
        </div>
      </div>

      <div className="payslips-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by month or year..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="payslips-table-card">
        <div className="table-wrapper">
          <table className="payslips-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips && payslips.length > 0 ? (
                payslips.map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td className="period-cell">
                      <div className="icon-wrapper">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="period-text">{p.month} {p.year}</div>
                        <div className="period-subtext">Payslip</div>
                      </div>
                    </td>
                    <td className="td-gross">{formatCurrency((p.baseSalary || 0) + (p.totalAllowances || 0))}</td>
                    <td className="td-deductions">{formatCurrency(p.totalDeductions || 0)}</td>
                    <td className="td-net">{formatCurrency(p.netPay || 0)}</td>
                    <td>
                      <span className={p.status === 'processed' || p.status === 'paid' ? 'badge badge-success' : 'badge badge-warning'}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button className="btn-download" onClick={() => setSelectedPayslip(p)} title="View & Download">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No payslips available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedPayslip && (
        <PayslipViewer 
          payslip={selectedPayslip} 
          onClose={() => setSelectedPayslip(null)} 
        />
      )}
    </div>
  );
}
