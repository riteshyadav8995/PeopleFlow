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

  const { data: departments } = useQuery({
    queryKey: ['departments', orgId],
    queryFn: async () => { const r = await api.get('/departments', { params: { organizationId: orgId } }); return r.data.data; },
    enabled: !!orgId,
  });

  const { data: designations } = useQuery({
    queryKey: ['designations', orgId],
    queryFn: async () => { const r = await api.get('/designations', { params: { organizationId: orgId } }); return r.data.data; },
    enabled: !!orgId,
  });

  const updateEmployeeDetails = async (employeeId: string, field: string, value: string) => {
    try {
      await api.put(`/employees/${employeeId}`, { [field]: value });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (err) {
      console.error('Failed to update employee details', err);
    }
  };

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
                  <th>Employee Name</th>
                  <th>Emp ID</th>
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
                      <div className="ssm-emp-name" style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                    </td>
                    <td>
                      <div className="ssm-emp-code" style={{ color: '#64748b' }}>{emp.employeeCode}</div>
                    </td>
                    <td>
                      <select 
                        style={{ padding: '0.375rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', maxWidth: '200px' }}
                        value={departments?.find((d: any) => d.name === emp.department?.name)?.id || ''}
                        onChange={(e) => updateEmployeeDetails(emp.id, 'departmentId', e.target.value)}
                      >
                        <option value="">—</option>
                        {departments?.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select 
                        style={{ padding: '0.375rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', maxWidth: '200px' }}
                        value={designations?.find((d: any) => d.title === emp.designation?.title)?.id || ''}
                        onChange={(e) => updateEmployeeDetails(emp.id, 'designationId', e.target.value)}
                      >
                        <option value="">—</option>
                        {designations?.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.title}</option>
                        ))}
                      </select>
                    </td>
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
                    <td colSpan={6} className="ssm-empty">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedEmployee && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'inherit'
        }}>
          {/* Top Bar */}
          <div style={{
            padding: '0.875rem 2.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(244,114,182,0.06), rgba(99,102,241,0.06))',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#f472b6,#6366f1)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {existingStructure ? 'Edit Salary Structure' : 'Assign Salary Structure'}
              </h2>
            </div>
            <button onClick={() => setSelectedEmployee(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: '1.5rem', transition: 'background 0.15s'
            }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--gray-100)')}
              onMouseOut={e => (e.currentTarget.style.background = 'none')}
            >&times;</button>
          </div>

          {/* Form Body */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2.5rem' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Employee Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #f472b6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem' }}>
                    {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{selectedEmployee.employeeCode} • {selectedEmployee.designation?.title || 'Employee'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Base Salary */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>BASE SALARY (₹/MONTH) *</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                      placeholder="e.g. 50000"
                      value={form.baseSalary || ''}
                      onChange={e => setForm(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                    />
                  </div>

                  {/* Effective Date */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>EFFECTIVE DATE *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                      value={form.effectiveDate}
                      onChange={e => setForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Allowances */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Allowances</span>
                    <button type="button" onClick={() => addComponent('allowances')} style={{ background: 'none', border: 'none', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {form.allowances.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                        <input
                          style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                          placeholder="Allowance name"
                          value={item.name}
                          onChange={e => updateComponent('allowances', i, 'name', e.target.value)}
                        />
                        <input
                          style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                          type="number"
                          placeholder="Amount"
                          value={item.amount || ''}
                          onChange={e => updateComponent('allowances', i, 'amount', e.target.value)}
                        />
                        <button type="button" onClick={() => removeComponent('allowances', i)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '36px', height: '36px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fecaca'} onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Deductions</span>
                    <button type="button" onClick={() => addComponent('deductions')} style={{ background: 'none', border: 'none', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {form.deductions.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                        <input
                          style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                          placeholder="Deduction name"
                          value={item.name}
                          onChange={e => updateComponent('deductions', i, 'name', e.target.value)}
                        />
                        <input
                          style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                          type="number"
                          placeholder="Amount"
                          value={item.amount || ''}
                          onChange={e => updateComponent('deductions', i, 'amount', e.target.value)}
                        />
                        <button type="button" onClick={() => removeComponent('deductions', i)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '36px', height: '36px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fecaca'} onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {message && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: message.includes('success') ? 'var(--success-glow)' : 'var(--danger-glow)',
                    color: message.includes('success') ? 'var(--success)' : 'var(--danger)',
                    fontSize: '0.875rem',
                    marginTop: '1rem'
                  }}>
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1.25rem 2.5rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setSelectedEmployee(null)} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: '#fff', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #f472b6, #6366f1)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, outline: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {saving && <Spinner size={14} color="#fff" />}
                {saving ? 'Saving...' : 'Save Structure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
