import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationService } from '@/services/organization.service';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/Spinner';
import { Building2, Plus } from 'lucide-react';
import './Departments.css';

export function Departments() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || 'demo-org-id';
  
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [desigForm, setDesigForm] = useState({ title: '', departmentId: '' });

  const { data: departments, isLoading: deptsLoading, refetch: refetchDepts } = useQuery({
    queryKey: ['departments', orgId],
    queryFn: () => organizationService.getDepartments(orgId)
  });

  const { data: designations, isLoading: desigsLoading, refetch: refetchDesigs } = useQuery({
    queryKey: ['designations', orgId],
    queryFn: () => organizationService.getDesignations(orgId)
  });

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await organizationService.createDepartment({ ...deptForm, organizationId: orgId });
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', code: '' });
      refetchDepts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleCreateDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await organizationService.createDesignation({ ...desigForm, organizationId: orgId });
      setIsDesigModalOpen(false);
      setDesigForm({ title: '', departmentId: '' });
      refetchDesigs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create designation');
    }
  };

  return (
    <div className="departments-container page-container">
      <div className="departments-header">
        <div className="departments-title-wrapper">
          <h1 className="departments-title">
            <Building2 className="departments-title-icon" size={24} />
            Departments & Designations
          </h1>
          <p className="departments-subtitle">Manage organizational structure and job titles.</p>
        </div>
      </div>

      <div className="departments-grid">
        {/* Departments Section */}
        <div className="dept-card">
          <div className="dept-card-header">
            <h2 className="dept-card-title">Departments</h2>
            <button onClick={() => setIsDeptModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add Dept
            </button>
          </div>
          
          {deptsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dept-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {departments?.length === 0 ? (
                    <tr>
                      <td colSpan={2}>
                        <div className="empty-state">No departments found.</div>
                      </td>
                    </tr>
                  ) : (
                    departments?.map((d: any) => (
                      <tr key={d.id}>
                        <td className="font-medium">{d.code}</td>
                        <td>{d.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Designations Section */}
        <div className="dept-card">
          <div className="dept-card-header">
            <h2 className="dept-card-title">Designations</h2>
            <button onClick={() => setIsDesigModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add Designation
            </button>
          </div>
          
          {desigsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dept-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {designations?.length === 0 ? (
                    <tr>
                      <td colSpan={2}>
                        <div className="empty-state">No designations found.</div>
                      </td>
                    </tr>
                  ) : (
                    designations?.map((d: any) => (
                      <tr key={d.id}>
                        <td className="font-medium">{d.title}</td>
                        <td>{d.department?.name || <span className="text-muted">-</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dept Modal */}
      {isDeptModalOpen && (
        <div className="dept-modal-overlay">
          <div className="dept-modal-content">
            <div className="dept-modal-header">
              <h3 className="dept-modal-title">Add New Department</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="dept-modal-close">&times;</button>
            </div>
            <form onSubmit={handleCreateDept} className="dept-modal-form">
              <div className="dept-form-group">
                <label className="dept-form-label">Department Name *</label>
                <input type="text" className="dept-form-input" required value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} />
              </div>
              <div className="dept-form-group">
                <label className="dept-form-label">Department Code *</label>
                <input type="text" className="dept-form-input" required value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} placeholder="e.g. ENG, HR, SALES" />
              </div>
              <div className="dept-modal-actions">
                <button className="btn-secondary" type="button" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {isDesigModalOpen && (
        <div className="dept-modal-overlay">
          <div className="dept-modal-content">
            <div className="dept-modal-header">
              <h3 className="dept-modal-title">Add New Designation</h3>
              <button onClick={() => setIsDesigModalOpen(false)} className="dept-modal-close">&times;</button>
            </div>
            <form onSubmit={handleCreateDesig} className="dept-modal-form">
              <div className="dept-form-group">
                <label className="dept-form-label">Job Title *</label>
                <input type="text" className="dept-form-input" required value={desigForm.title} onChange={e => setDesigForm({...desigForm, title: e.target.value})} />
              </div>
              <div className="dept-form-group">
                <label className="dept-form-label">Department *</label>
                <select required value={desigForm.departmentId} onChange={e => setDesigForm({...desigForm, departmentId: e.target.value})} className="dept-form-select">
                  <option value="">Select Department...</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="dept-modal-actions">
                <button className="btn-secondary" type="button" onClick={() => setIsDesigModalOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
