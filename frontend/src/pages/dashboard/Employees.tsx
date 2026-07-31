import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/Spinner';
import { Link } from 'react-router-dom';
import { Users, Search, Plus, UserCircle } from 'lucide-react';
import { organizationService } from '@/services/organization.service';
import './Employees.css';

export function Employees() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || 'demo-org-id';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Employee',
    departmentId: '',
    designationId: '',
    reportingTo: '',
    employeeCode: `EMP-${Math.floor(Math.random() * 10000)}`,
    joinDate: new Date().toISOString()
  });

  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ['employees', orgId],
    queryFn: () => employeeService.getEmployees(orgId)
  });

  const { data: departments } = useQuery({
    queryKey: ['departments', orgId],
    queryFn: () => organizationService.getDepartments(orgId)
  });

  const { data: designations } = useQuery({
    queryKey: ['designations', orgId],
    queryFn: () => organizationService.getDesignations(orgId)
  });

  const filteredEmployees = employees?.filter((emp: any) => 
    emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        organizationId: orgId
      };
      
      // Remove empty UUID strings to prevent Zod validation errors on the backend
      if (!payload.departmentId) delete payload.departmentId;
      if (!payload.designationId) delete payload.designationId;
      if (!payload.reportingTo) delete payload.reportingTo;

      await employeeService.createEmployee(payload);
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'Employee',
        departmentId: '',
        designationId: '',
        reportingTo: '',
        employeeCode: `EMP-${Math.floor(Math.random() * 10000)}`,
        joinDate: new Date().toISOString()
      });
      refetch();
      alert('Employee created and invitation sent successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create employee');
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
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Employee</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleCreateEmployee} className="modal-form">
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
                    {departments?.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select value={formData.designationId} onChange={e => setFormData({...formData, designationId: e.target.value})} className="form-select">
                    <option value="">Select Designation...</option>
                    {designations?.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
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
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit">Save Employee</button>
              </div>
            </form>
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
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees?.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
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
                        <div className="employee-info-cell">
                          <div className="employee-avatar">
                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="employee-name">{emp.firstName} {emp.lastName}</div>
                            <div className="employee-email">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="td-id">{emp.employeeCode}</td>
                      <td>{emp.department?.name || '-'}</td>
                      <td>{emp.designation?.title || '-'}</td>
                      <td>
                        <span className={`status-badge ${
                          emp.status === 'active' ? 'active' :
                          emp.status === 'probation' ? 'probation' :
                          emp.status === 'terminated' ? 'terminated' :
                          'default'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/employees/${emp.id}`} className="btn-link">
                          View Profile
                        </Link>
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
