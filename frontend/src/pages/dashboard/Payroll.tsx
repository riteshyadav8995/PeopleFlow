import { useState, useEffect } from 'react';
import { payrollService } from '@/services/payroll.service';
import type { Payslip } from '@/services/payroll.service';
import { useAuthStore } from '@/store/auth.store';
import { 
  FileText, Play, CheckCircle2, DollarSign, TrendingUp, 
  AlertCircle, Settings2, Users, Eye 
} from 'lucide-react';
import { PayslipViewer } from './payroll/PayslipViewer';
import { SalaryStructureManager } from './payroll/SalaryStructureManager';
import './Payroll.css';

type Tab = 'payslips' | 'salary-structures';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function Payroll() {
  const { user } = useAuthStore();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<Tab>('payslips');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const organizationId = (user as any)?.organizationId || '';
  const isSuperAdmin = user?.roles.includes('super_admin');
  const isAdmin = user?.roles.includes('tenant_admin') || isSuperAdmin;

  const fetchPayslips = async () => {
    if (!organizationId && !isSuperAdmin) return;
    try {
      setLoading(true);
      const data = await payrollService.getPayslips(organizationId, filterMonth, filterYear);
      setPayslips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [organizationId, filterMonth, filterYear]);

  const handleGeneratePayroll = async () => {
    try {
      setGenerating(true);
      setMessage('');
      const runRes = await payrollService.generatePayrollRun({
        organizationId: organizationId,
        month: filterMonth,
        year: filterYear,
        groupId: 'default-group-id',
        periodId: 'default-period-id',
      });
      const runId = runRes.data?.id;
      if (runId) {
        await payrollService.approvePayrollRun(runId);
        await payrollService.publishPayrollRun(runId);
        setMessage(`✓ ${fullMonths[filterMonth - 1]} ${filterYear} payroll run completed. Payslips published.`);
        setMessageType('success');
      } else {
        setMessage('Payroll generated but could not auto-approve. Please check exceptions.');
        setMessageType('error');
      }
      fetchPayslips();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to process payroll run. Check salary structures exist.');
      setMessageType('error');
    } finally {
      setGenerating(false);
    }
  };

  const totalNetPay = payslips.reduce((sum, p) => sum + p.netPay, 0);
  const paidCount = payslips.filter(p => p.status === 'paid' || p.status === 'processed').length;
  const draftCount = payslips.filter(p => p.status === 'draft').length;

  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="payroll-container page-container">
      {/* Hero */}
      <div className="payroll-hero">
        <div>
          <h1 className="payroll-title">
            <span className="payroll-title-icon"><DollarSign size={32} /></span>
            Payroll Operations
          </h1>
          <p className="payroll-subtitle">
            Automate monthly salary disbursements with the Maker-Checker approval workflow. 
            Set salary structures, run payroll, and publish payslips.
          </p>
        </div>
        {isAdmin && (
          <div className="payroll-hero-actions">
            <button
              className="btn-secondary-action"
              onClick={() => setActiveTab('salary-structures')}
            >
              <Settings2 size={16} /> Salary Structures
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`payroll-message ${messageType}`}>
          {messageType === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="payroll-stats">
        <div className="payroll-stat-card brand">
          <div className="payroll-stat-icon"><FileText size={16} /></div>
          <p className="payroll-stat-label">Total Payslips:</p>
          <p className="payroll-stat-value">{payslips.length}</p>
        </div>
        
        <div className="payroll-stat-card success">
          <div className="payroll-stat-icon"><DollarSign size={16} /></div>
          <p className="payroll-stat-label">Total Disbursement:</p>
          <p className="payroll-stat-value">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalNetPay)}
          </p>
        </div>
        
        <div className="payroll-stat-card info">
          <div className="payroll-stat-icon"><CheckCircle2 size={16} /></div>
          <p className="payroll-stat-label">Processed:</p>
          <p className="payroll-stat-value">{paidCount}</p>
        </div>
        
        <div className="payroll-stat-card warning">
          <div className="payroll-stat-icon"><TrendingUp size={16} /></div>
          <p className="payroll-stat-label">Pending / Draft:</p>
          <p className="payroll-stat-value warning-text">{draftCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="payroll-tabs">
        <button
          className={`payroll-tab ${activeTab === 'payslips' ? 'active' : ''}`}
          onClick={() => setActiveTab('payslips')}
        >
          <FileText size={16} /> Payslip Directory
        </button>
        {isAdmin && (
          <button
            className={`payroll-tab ${activeTab === 'salary-structures' ? 'active' : ''}`}
            onClick={() => setActiveTab('salary-structures')}
          >
            <Settings2 size={16} /> Salary Structures
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'payslips' && (
        <div className="payroll-table-card">
          <div className="payroll-table-header">
            <h3>Payslip Directory</h3>
            <div className="payroll-toolbar">
              <select
                className="filter-select"
                value={filterMonth}
                onChange={e => setFilterMonth(Number(e.target.value))}
              >
                {fullMonths.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-payslips"><Play size={20} /> Loading payslips...</div>
          ) : payslips.length === 0 ? (
            <div className="empty-payslips">
              <FileText size={48} style={{ color: 'var(--gray-300)' }} />
              <p>No payslips found for {fullMonths[filterMonth - 1]} {filterYear}.</p>
              {isAdmin && (
                <p style={{ fontSize: '0.875rem' }}>
                  First assign salary structures to employees, then click "Run Payroll" to generate payslips.
                </p>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Base Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map(slip => (
                    <tr key={slip.id}>
                      <td>
                        <div className="emp-name">{slip.employee?.firstName} {slip.employee?.lastName}</div>
                        <div className="emp-code">{slip.employee?.employeeCode}</div>
                      </td>
                      <td className="td-period">{months[slip.month - 1]} {slip.year}</td>
                      <td>₹{slip.baseSalary.toLocaleString()}</td>
                      <td className="td-allowances">+₹{slip.totalAllowances.toLocaleString()}</td>
                      <td className="td-deductions">-₹{slip.totalDeductions.toLocaleString()}</td>
                      <td className="td-net">₹{slip.netPay.toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${slip.status === 'paid' || slip.status === 'processed' ? 'success' : slip.status === 'draft' ? 'neutral' : 'warning'}`}>
                          {slip.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-view-pdf" onClick={() => setSelectedPayslip(slip)}>
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'salary-structures' && isAdmin && (
        <SalaryStructureManager />
      )}

      {/* Payslip Viewer Modal */}
      {selectedPayslip && (
        <PayslipViewer
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
}
