import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Info, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useAuthStore } from '../../../store/auth.store';
import { payrollService } from '../../../services/payroll.service';
import { Spinner } from '../../../components/ui/Spinner';
import './SalaryStructure.css';

export function SalaryStructure() {
  const { user } = useAuthStore();
  const employeeId = user?.employeeId || '';

  const { data: structure, isLoading } = useQuery({
    queryKey: ['salaryStructure', employeeId],
    queryFn: () => payrollService.getSalaryStructure(employeeId),
    enabled: !!employeeId,
    retry: false,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (!structure && !isLoading) {
    return (
      <div className="salary-structure-container page-container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>No Salary Structure Found</h2>
        <p>Please contact HR to generate your salary structure.</p>
      </div>
    );
  }

  const baseSalary = structure?.baseSalary ?? 0;
  
  // Real data comes as an array of components from API or we can just parse it
  // Assuming the API returns components array: { type: 'ALLOWANCE' | 'DEDUCTION', name: string, amount: number }
  const components = structure?.components || [];
  const allowances = components.filter((c: any) => c.type === 'ALLOWANCE').map((c: any) => ({ name: c.name, amount: Number(c.amount) }));
  const deductions = components.filter((c: any) => c.type === 'DEDUCTION').map((c: any) => ({ name: c.name, amount: Number(c.amount) }));

  const totalAllowances = allowances.reduce((sum: number, item: any) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce((sum: number, item: any) => sum + item.amount, 0);
  const grossEarnings = baseSalary + totalAllowances;
  const netSalary = grossEarnings - totalDeductions;
  const ctc = (structure?.ctc) ? Number(structure.ctc) : netSalary * 12;

  const chartData = [
    { name: 'Net Salary', value: netSalary, color: '#16a34a' },
    { name: 'Total Deductions', value: totalDeductions, color: '#dc2626' },
  ];

  if (isLoading) {
    return (
      <div className="salary-structure-container page-container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="salary-structure-container page-container">
      <div className="structure-header">
        <div>
          <h1 className="structure-title">Salary Structure</h1>
          <p className="structure-subtitle">
            {structure
              ? `Effective from ${new Date(structure.effectiveDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : 'Detailed breakdown of your current compensation.'}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => window.print()}>
          <Download size={18} /> Download Structure
        </button>
      </div>

      <div className="structure-layout">
        {/* Breakdown Table */}
        <div className="structure-table-card">
          <div className="table-header-row">
            <h2 className="table-header-title">Monthly Breakdown</h2>
            <div className="table-header-subtitle">Estimated CTC: {formatCurrency(ctc)} / year</div>
          </div>
          
          <table className="structure-table">
            <thead>
              <tr>
                <th className="th-left">Earnings</th>
                <th className="th-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-label">Basic Salary</td>
                <td className="td-amount">{formatCurrency(baseSalary)}</td>
              </tr>
              {allowances.map((item, idx) => (
                <tr key={idx}>
                  <td className="td-label">{item.name}</td>
                  <td className="td-amount">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="row-subtotal">
                <td className="td-label">Gross Earnings (A)</td>
                <td className="td-amount amount-success">{formatCurrency(grossEarnings)}</td>
              </tr>
              
              <tr>
                <th className="th-left">Deductions</th>
                <th className="th-right"></th>
              </tr>
              {deductions.map((item, idx) => (
                <tr key={idx}>
                  <td className="td-label">{item.name}</td>
                  <td className="td-amount">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="row-subtotal">
                <td className="td-label">Total Deductions (B)</td>
                <td className="td-amount amount-danger">{formatCurrency(totalDeductions)}</td>
              </tr>
              
              <tr className="row-total">
                <td className="td-label">Net Take Home (A - B)</td>
                <td className="td-amount">{formatCurrency(netSalary)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Visual Summary */}
        <div className="sidebar-layout">
          <div className="chart-card">
            <h3 className="chart-title">
              <PieChartIcon size={18} className="chart-title-icon" />
              Salary Distribution
            </h3>
            
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend">
              {chartData.map((item, idx) => (
                <div key={idx} className="legend-item">
                  <div className="legend-label-wrapper">
                    <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                    <span className="legend-label">{item.name}</span>
                  </div>
                  <span className="legend-value">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="info-card">
            <h3 className="info-title">
              <Info size={16} /> Important Information
            </h3>
            <p className="info-text">
              This salary structure is applicable for the current financial year. Income tax calculations are estimates based on your declared investments. Final TDS may vary based on actual proof submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
