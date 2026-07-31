import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2, Plus, Search, Trash2, X, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import { payrollService, type PayrollComponent } from '../../../services/payroll.service';
import { Spinner } from '../../../components/ui/Spinner';
import './SalaryStructureManager.css';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation?: { title: string };
  department?: { name: string };
}

interface StructureForm {
  baseSalary: number;
  effectiveDate: string;
  allowances: PayrollComponent[];
  deductions: PayrollComponent[];
}

const defaultForm: StructureForm = {
  baseSalary: 0,
  effectiveDate: new Date().toISOString().split('T')[0],
  allowances: [{ name: 'House Rent Allowance', amount: 0 }],
  deductions: [{ name: 'Provident Fund', amount: 0 }],
};

export function SalaryStructureManager() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || '';
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<StructureForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', orgId],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { organizationId: orgId, limit: 100 } });
      return res.data.data as Employee[];
    },
    enabled: !!orgId,
  });

  // Fetch salary structure for a selected employee
  const { data: existingStructure, refetch: refetchStructure } = useQuery({
    queryKey: ['salaryStructure', selectedEmployee?.id],
    queryFn: () => payrollService.getSalaryStructure(selectedEmployee!.id),
    enabled: !!selectedEmployee,
    retry: false,
  });

  const openModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setMessage('');
  };

  // Pre-fill form when structure loads
  React.useEffect(() => {
    if (existingStructure) {
      setForm({
        baseSalary: existingStructure.baseSalary,
        effectiveDate: existingStructure.effectiveDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        allowances: existingStructure.allowances || [],
        deductions: existingStructure.deductions || [],
      });
    } else {
      setForm(defaultForm);
    }
  }, [existingStructure, selectedEmployee]);

  const handleSave = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    setMessage('');
    try {
      await payrollService.upsertSalaryStructure({
        employeeId: selectedEmployee.id,
        baseSalary: Number(form.baseSalary),
        allowances: form.allowances.map(a => ({ name: a.name, amount: Number(a.amount) })),
        deductions: form.deductions.map(d => ({ name: d.name, amount: Number(d.amount) })),
        effectiveDate: form.effectiveDate,
      });
      setMessage('Salary structure saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['salaryStructure'] });
      setTimeout(() => {
        setSelectedEmployee(null);
        setMessage('');
      }, 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to save salary structure.');
    } finally {
      setSaving(false);
    }
  };

  const addComponent = (type: 'allowances' | 'deductions') => {
    setForm(prev => ({
      ...prev,
      [type]: [...prev[type], { name: '', amount: 0 }],
    }));
  };

  const updateComponent = (type: 'allowances' | 'deductions', index: number, field: 'name' | 'amount', value: string) => {
    setForm(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) =>
        i === index ? { ...item, [field]: field === 'amount' ? Number(value) : value } : item
      ),
    }));
  };

  const removeComponent = (type: 'allowances' | 'deductions', index: number) => {
    setForm(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const filteredEmployees = employees?.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ssm-container page-container">
      <div className="ssm-header">
        <div>
          <h1 className="ssm-title">
            <Settings2 className="ssm-title-icon" size={24} />
            Salary Structure Management
          </h1>
          <p className="ssm-subtitle">Assign and edit salary structures for all employees.</p>
        </div>
      </div>

      <div className="ssm-card">
        <div className="ssm-toolbar">
          <div className="ssm-search-wrapper">
            <Search size={16} className="ssm-search-icon" />
            <input
              type="text"
              placeholder="Search employees..."
              className="ssm-search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        ) : (
          <div className="ssm-table-wrapper">
            <table className="ssm-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Base Salary</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees?.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="ssm-emp-cell">
                        <div className="ssm-emp-avatar">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="ssm-emp-name">{emp.firstName} {emp.lastName}</div>
                          <div className="ssm-emp-code">{emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department?.name || '—'}</td>
                    <td>{emp.designation?.title || '—'}</td>
                    <td>
                      <span 
                        className="ssm-no-structure" 
                        style={{ cursor: 'pointer', color: 'var(--brand)', textDecoration: 'underline' }}
                        onClick={() => openModal(emp)}
                      >
                        Click to view
                      </span>
                    </td>
                    <td>
                      <button className="btn-assign" onClick={() => openModal(emp)}>
                        <Edit2 size={14} /> Assign / Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="ssm-empty">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {existingStructure ? 'Edit' : 'Assign'} Salary Structure
              </h2>
              <button className="modal-close" onClick={() => setSelectedEmployee(null)}>&times;</button>
            </div>

            <div className="modal-body">
              {/* Employee Info */}
              <div className="modal-employee-info">
                <div className="modal-emp-avatar">
                  {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                </div>
                <div>
                  <div className="modal-emp-name">{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                  <div className="modal-emp-code">{selectedEmployee.employeeCode} • {selectedEmployee.designation?.title || 'Employee'}</div>
                </div>
              </div>

              {/* Base Salary */}
              <div className="form-group">
                <label className="form-label">Base Salary (₹/month) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 50000"
                  value={form.baseSalary || ''}
                  onChange={e => setForm(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                />
              </div>

              {/* Effective Date */}
              <div className="form-group">
                <label className="form-label">Effective Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.effectiveDate}
                  onChange={e => setForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                />
              </div>

              {/* Allowances */}
              <div className="components-section">
                <div className="components-header">
                  <span className="components-title">Allowances</span>
                  <button className="btn-add-comp" onClick={() => addComponent('allowances')}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {form.allowances.map((item, i) => (
                  <div key={i} className="component-row">
                    <input
                      className="form-input"
                      placeholder="Allowance name"
                      value={item.name}
                      onChange={e => updateComponent('allowances', i, 'name', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={e => updateComponent('allowances', i, 'amount', e.target.value)}
                    />
                    <button className="btn-remove-comp" onClick={() => removeComponent('allowances', i)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Deductions */}
              <div className="components-section">
                <div className="components-header">
                  <span className="components-title">Deductions</span>
                  <button className="btn-add-comp" onClick={() => addComponent('deductions')}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {form.deductions.map((item, i) => (
                  <div key={i} className="component-row">
                    <input
                      className="form-input"
                      placeholder="Deduction name"
                      value={item.name}
                      onChange={e => updateComponent('deductions', i, 'name', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={e => updateComponent('deductions', i, 'amount', e.target.value)}
                    />
                    <button className="btn-remove-comp" onClick={() => removeComponent('deductions', i)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {message && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: message.includes('success') ? 'var(--success-glow)' : 'var(--danger-glow)',
                  color: message.includes('success') ? 'var(--success)' : 'var(--danger)',
                  fontSize: '0.875rem',
                }}>
                  {message}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary-modal" onClick={() => setSelectedEmployee(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Structure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
