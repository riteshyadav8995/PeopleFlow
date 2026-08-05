import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, UserCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { organizationService } from '@/services/organization.service';
import './Employees.css';

function ThreeDotMenu({ emp, onEdit, onDelete }: { emp: any; onEdit: (emp: any) => void; onDelete: (emp: any) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="three-dot-btn" onClick={() => setOpen(o => !o)} title="More actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="three-dot-dropdown">
          <button className="three-dot-item" onClick={() => { onEdit(emp); setOpen(false); }}>
            <Pencil size={14} /> Edit
          </button>
          <button className="three-dot-item three-dot-danger" onClick={() => { onDelete(emp); setOpen(false); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function Employees() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const orgId = user?.organizationId || 'demo-org-id';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: 'Employee',
    departmentId: '', designationId: '', reportingTo: '',
    employeeCode: `EMP-${Math.floor(Math.random() * 10000)}`,
    joinDate: new Date().toISOString()
  });

  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ['employees', orgId],
    queryFn: () => employeeService.getEmployees(orgId)
  });
  const { data: departments } = useQuery({ queryKey: ['departments', orgId], queryFn: () => organizationService.getDepartments(orgId) });
  const { data: designations } = useQuery({ queryKey: ['designations', orgId], queryFn: () => organizationService.getDesignations(orgId) });

  const filteredEmployees = employees?.filter((emp: any) =>
    emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditEmployee(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', role: 'Employee', departmentId: '', designationId: '', reportingTo: '', employeeCode: `EMP-${Math.floor(Math.random() * 10000)}`, joinDate: new Date().toISOString() });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    setEditEmployee(emp);
    setFormData({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email, phone: emp.phone || '',
      role: emp.role || 'Employee', departmentId: emp.departmentId || '', designationId: emp.designationId || '',
      reportingTo: emp.reportingTo || '', employeeCode: emp.employeeCode, joinDate: emp.joinDate
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData, organizationId: orgId };
      if (!payload.departmentId) delete payload.departmentId;
      if (!payload.designationId) delete payload.designationId;
      if (!payload.reportingTo) delete payload.reportingTo;
      if (editEmployee) {
        await employeeService.updateEmployee(editEmployee.id, payload);
        alert('Employee updated successfully!');
      } else {
        await employeeService.createEmployee(payload);
        alert('Employee created and invitation sent successfully!');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await employeeService.deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="employees-container page-container">
      <div className="employees-header">
        <div className="employees-title-wrapper">
          <h1 className="employees-title">
            <Users className="employees-title-icon" size={24} />
            Employee Directory
          </h1>
          <p className="employees-subtitle">Manage all employees in your organization.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-input" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" className="form-input" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="form-select">
                    <option value="">Select Department...</option>
                    {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select value={formData.designationId} onChange={e => setFormData({...formData, designationId: e.target.value})} className="form-select">
                    <option value="">Select Designation...</option>
                    {designations?.map((d: any) => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="form-select">
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Recruiter">Recruiter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reporting Manager</label>
                  <select value={formData.reportingTo} onChange={e => setFormData({...formData, reportingTo: e.target.value})} className="form-select">
                    <option value="">Select Manager...</option>
                    {employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit">{editEmployee ? 'Update Employee' : 'Save Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={18} /> Confirm Delete
              </h3>
              <button onClick={() => setDeleteTarget(null)} className="modal-close">&times;</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#374151', marginBottom: '0.5rem' }}>
                Are you sure you want to delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>?
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '0 1.5rem 1.5rem' }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="employees-card">
        <div className="employees-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th style={{ width: '48px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees?.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <UserCircle className="empty-state-icon" size={48} />
                        <p>No employees found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees?.map((emp: any) => (
                    <tr key={emp.id}>
                      <td>
                        <button
                          className="emp-name-link"
                          onClick={() => navigate(`/organization/employees/${emp.id}`)}
                          title="View Profile"
                        >
                          {emp.firstName} {emp.lastName}
                        </button>
                      </td>
                      <td className="td-muted">{emp.email}</td>
                      <td className="td-id">{emp.employeeCode}</td>
                      <td>{emp.department?.name || '-'}</td>
                      <td>{emp.designation?.title || '-'}</td>
                      <td>
                        <span className={`status-badge ${
                          emp.status === 'active' ? 'active' :
                          emp.status === 'probation' ? 'probation' :
                          emp.status === 'terminated' ? 'terminated' : 'default'
                        }`}>
                          {emp.status || 'active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <ThreeDotMenu emp={emp} onEdit={openEditModal} onDelete={setDeleteTarget} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
