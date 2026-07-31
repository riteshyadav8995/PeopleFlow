import { useState, useEffect } from 'react';
import { X as CloseIcon, Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { organizationService } from '@/services/organization.service';
import { employeeService } from '@/services/employee.service';
import { useAuthStore } from '@/store/auth.store';
import './ProjectModal.css';

interface AddProjectMemberModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export function AddProjectMemberModal({ onClose, onSubmit, isSubmitting }: AddProjectMemberModalProps) {
  const { user } = useAuthStore();
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user?.organizationId]);

  const fetchData = async () => {
    try {
      const orgId = user?.organizationId || '';
      const [deptRes, empRes] = await Promise.all([
        organizationService.getDepartments(orgId),
        employeeService.getEmployees(orgId)
      ]);
      setDepartments(deptRes || []);
      setEmployees(empRes || []);
    } catch (error) {
      console.error('Failed to fetch modal data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchDept = selectedDept ? emp.departmentId === selectedDept : true;
    const matchSearch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    onSubmit({
      employeeId: selectedEmployee,
      role,
      allocation: 100
    });
  };

  return (
    <div className="project-modal-overlay">
      <div className="project-modal-container small">
        <div className="project-modal-header">
          <h2 className="project-modal-title">Add Project Member</h2>
          <button onClick={onClose} className="project-modal-close">
            <CloseIcon size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : (
          <form onSubmit={handleSubmit} className="project-modal-body">
            
            <div className="project-form-group">
              <label className="project-form-label">Select Department (Optional filter)</label>
              <select 
                value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                className="project-form-select"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="project-form-group">
              <label className="project-form-label">Select Employee *</label>
              <div className="project-search-container">
                <Search size={16} className="project-search-icon" />
                <input 
                  type="text" placeholder="Search employees..." 
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="project-search-input"
                />
              </div>
              <div className="project-list-container">
                {filteredEmployees.length === 0 && <div className="project-list-empty">No employees found.</div>}
                {filteredEmployees.map(emp => (
                  <label key={emp.id} className={`project-list-item ${selectedEmployee === emp.id ? 'selected' : ''}`}>
                    <input 
                      type="radio" name="employee"
                      checked={selectedEmployee === emp.id}
                      onChange={() => setSelectedEmployee(emp.id)}
                      className="project-list-radio"
                    />
                    <div className="project-list-content">
                      <span className="project-list-name">{emp.firstName} {emp.lastName}</span>
                      <span className="project-list-role">{emp.title || 'Employee'}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="project-form-group">
              <label className="project-form-label">Role</label>
              <select 
                value={role} onChange={e => setRole(e.target.value)}
                className="project-form-select"
              >
                <option value="DEVELOPER">Developer</option>
                <option value="DESIGNER">Designer</option>
                <option value="QA">QA</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </form>
        )}

        <div className="project-modal-footer">
          <button 
            type="button" onClick={onClose}
            className="project-btn-cancel"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedEmployee}
            className="project-btn-submit"
          >
            {isSubmitting ? <Spinner /> : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
