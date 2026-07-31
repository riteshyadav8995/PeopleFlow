import { useState, useEffect } from 'react';
import { X as CloseIcon, Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { organizationService } from '@/services/organization.service';
import { employeeService } from '@/services/employee.service';
import { useAuthStore } from '@/store/auth.store';
import './ProjectModal.css';

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export function CreateProjectModal({ onClose, onSubmit, isSubmitting }: CreateProjectModalProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  const [managerSearch, setManagerSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  
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

  const getFilteredEmployees = (searchString: string) => {
    return employees.filter(emp => {
      const matchDept = selectedDept ? emp.departmentId === selectedDept : true;
      const matchSearch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(searchString.toLowerCase());
      return matchDept && matchSearch;
    });
  };

  const managerOptions = getFilteredEmployees(managerSearch);
  const memberOptions = getFilteredEmployees(memberSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !selectedManager) {
      alert("Name, Code, and Manager are required.");
      return;
    }
    onSubmit({
      name,
      code,
      description,
      managerId: selectedManager,
      employeeIds: selectedMembers,
      organizationId: user?.organizationId
    });
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="project-modal-overlay">
      <div className="project-modal-container">
        <div className="project-modal-header">
          <h2 className="project-modal-title">Create New Project</h2>
          <button onClick={onClose} className="project-modal-close">
            <CloseIcon size={20} />
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : (
          <form onSubmit={handleSubmit} className="project-modal-body">
            
            <div className="project-form-grid">
              <div className="project-form-group">
                <label className="project-form-label">Project Name *</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="project-form-input"
                  placeholder="e.g. Website Redesign"
                />
              </div>
              <div className="project-form-group">
                <label className="project-form-label">Project Code *</label>
                <input 
                  type="text" required value={code} onChange={e => setCode(e.target.value)}
                  className="project-form-input"
                  placeholder="e.g. PRJ-001"
                />
              </div>
            </div>

            <div className="project-form-group">
              <label className="project-form-label">Description</label>
              <textarea 
                value={description} onChange={e => setDescription(e.target.value)}
                className="project-form-textarea"
                rows={3} placeholder="Brief description of the project"
              />
            </div>

            <hr className="project-modal-divider" />
            
            <h3 className="project-section-title">Team Assignment</h3>

            <div className="project-form-group">
              <label className="project-form-label">Select Department (Filter)</label>
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
              <label className="project-form-label">Project Manager *</label>
              <div className="project-search-container">
                <Search size={16} className="project-search-icon" />
                <input 
                  type="text" placeholder="Search managers..." 
                  value={managerSearch} onChange={e => setManagerSearch(e.target.value)}
                  className="project-search-input"
                />
              </div>
              <div className="project-list-container">
                {managerOptions.length === 0 && <div className="project-list-empty">No employees found.</div>}
                {managerOptions.map(emp => (
                  <label key={emp.id} className={`project-list-item ${selectedManager === emp.id ? 'selected' : ''}`}>
                    <input 
                      type="radio" name="manager" 
                      checked={selectedManager === emp.id}
                      onChange={() => setSelectedManager(emp.id)}
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
              <label className="project-form-label">Assign Team Members</label>
              <div className="project-search-container">
                <Search size={16} className="project-search-icon" />
                <input 
                  type="text" placeholder="Search employees..." 
                  value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                  className="project-search-input"
                />
              </div>
              <div className="project-list-container">
                {memberOptions.length === 0 && <div className="project-list-empty">No employees found.</div>}
                {memberOptions.map(emp => (
                  <label key={emp.id} className={`project-list-item ${selectedMembers.includes(emp.id) ? 'selected' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedMembers.includes(emp.id)}
                      onChange={() => toggleMember(emp.id)}
                      className="project-list-checkbox"
                    />
                    <div className="project-list-content">
                      <span className="project-list-name">{emp.firstName} {emp.lastName}</span>
                      <span className="project-list-role">{emp.title || 'Employee'}</span>
                    </div>
                  </label>
                ))}
              </div>
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
            disabled={isSubmitting || !name || !code || !selectedManager}
            className="project-btn-submit"
          >
            {isSubmitting ? <Spinner /> : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
