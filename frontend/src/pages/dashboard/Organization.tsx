import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Building2, Network, GitBranch, MapPin, X } from 'lucide-react';
import { organizationService } from '@/services/organization.service';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import './Organization.css';

export function Organization() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'branches' | 'departments' | 'designations'>('profile');

  // Currently defaulting to the first organization if tenant has multiple
  const orgId = user?.organizationId || user?.tenantId || 'demo-org-id';
  const queryClient = useQueryClient();

  // Modals state
  const [modalType, setModalType] = useState<'branch' | 'department' | 'designation' | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', isHeadOffice: false, latitude: '', longitude: '' });

  const closeModals = () => {
    setModalType(null);
    setFormData({ name: '', code: '', isHeadOffice: false, latitude: '', longitude: '' });
  };

  const { data: branches, isLoading: loadingBranches } = useQuery({
    queryKey: ['branches', orgId],
    queryFn: () => organizationService.getBranches(orgId),
    enabled: activeTab === 'branches'
  });

  const { data: departments, isLoading: loadingDepts } = useQuery({
    queryKey: ['departments', orgId],
    queryFn: () => organizationService.getDepartments(orgId),
    enabled: activeTab === 'departments'
  });

  const { data: designations, isLoading: loadingDesigs } = useQuery({
    queryKey: ['designations', orgId],
    queryFn: () => organizationService.getDesignations(orgId),
    enabled: activeTab === 'designations'
  });

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'branches', label: 'Branches', icon: MapPin },
    { id: 'departments', label: 'Departments', icon: Network },
    { id: 'designations', label: 'Designations', icon: GitBranch },
  ] as const;

  const createMutation = useMutation({
    mutationFn: async (type: string) => {
      let payload: any = { ...formData, organizationId: orgId };
      if (type === 'branch') {
        payload.latitude = payload.latitude ? parseFloat(payload.latitude) : undefined;
        payload.longitude = payload.longitude ? parseFloat(payload.longitude) : undefined;
        return organizationService.createBranch(payload);
      }
      if (type === 'department') return organizationService.createDepartment(payload);
      if (type === 'designation') return organizationService.createDesignation(payload);
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: [type === 'branch' ? 'branches' : type === 'department' ? 'departments' : 'designations', orgId] });
      closeModals();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType) {
      createMutation.mutate(modalType);
    }
  };

  return (
    <div className="org-container">
      <div className="org-header">
        <h1 className="org-title">Organization Settings</h1>
        <p className="org-subtitle">Manage your company structure and profile.</p>
      </div>

      <div className="org-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`org-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'profile' && (
          <div className="org-card">
            <div className="org-card-top-bar"></div>
            <div className="org-card-content">
              <div className="org-card-header">
                <div className="org-card-title-group">
                  <div className="org-card-icon-wrapper">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h2 className="org-card-title">Company Profile</h2>
                    <p className="org-card-subtitle">Manage basic information and details about your organization</p>
                  </div>
                </div>
              </div>
              
              <div className="org-profile-grid">
                <div className="org-profile-item">
                  <label className="org-profile-label">
                    <span className="org-profile-dot"></span> Company Name
                  </label>
                  <div className="org-profile-value">
                    {user?.tenantId ? 'Tenant ' + user.tenantId.substring(0,6) : 'Acme Corp'}
                  </div>
                </div>
                
                <div className="org-profile-item">
                  <label className="org-profile-label">
                    <span className="org-profile-dot"></span> Domain
                  </label>
                  <div className="org-profile-value">
                    acme.com
                  </div>
                </div>
                
                <div className="org-profile-item">
                  <label className="org-profile-label">
                    <span className="org-profile-dot"></span> Administrator Email
                  </label>
                  <div className="org-profile-value">
                    {user?.email || 'admin@acme.com'}
                  </div>
                </div>
                
                <div className="org-profile-item">
                  <label className="org-profile-label">
                    <span className="org-profile-dot"></span> Current Plan
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="org-profile-value capitalize">Enterprise</span>
                    <span className="org-badge-active">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="org-card">
            <div className="org-card-top-bar"></div>
            <div className="org-card-content">
              <div className="org-card-header">
                <div className="org-card-title-group">
                  <div className="org-card-icon-wrapper">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h2 className="org-card-title">Branches</h2>
                    <p className="org-card-subtitle">Manage all physical locations</p>
                  </div>
                </div>
                <Button variant="primary" onClick={() => setModalType('branch')}>Add Branch</Button>
              </div>
              {loadingBranches ? <Spinner /> : (
                <div className="org-table-container">
                  <table className="org-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Coordinates</th>
                        <th>Head Office</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches?.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>No branches found.</td></tr>
                      ) : (
                        branches?.map((branch: any) => (
                          <tr key={branch.id}>
                            <td className="org-table-name">{branch.name}</td>
                            <td className="org-table-code">{branch.code || '-'}</td>
                            <td className="org-table-mono">
                              {branch.latitude && branch.longitude ? `${branch.latitude}, ${branch.longitude}` : 'Not Set'}
                            </td>
                            <td>
                              {branch.isHeadOffice 
                                ? <span className="org-badge-yes">Yes</span> 
                                : <span className="org-badge-no">No</span>}
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
        )}

        {activeTab === 'departments' && (
          <div className="org-card">
            <div className="org-card-top-bar"></div>
            <div className="org-card-content">
              <div className="org-card-header">
                <div className="org-card-title-group">
                  <div className="org-card-icon-wrapper">
                    <Network size={24} />
                  </div>
                  <div>
                    <h2 className="org-card-title">Departments</h2>
                    <p className="org-card-subtitle">Organize your workforce into functional areas</p>
                  </div>
                </div>
                <Button variant="primary" onClick={() => setModalType('department')}>Add Department</Button>
              </div>
              {loadingDepts ? <Spinner /> : (
                <div className="org-table-container">
                  <table className="org-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments?.length === 0 ? (
                        <tr><td colSpan={2} style={{ textAlign: 'center', padding: '3rem' }}>No departments found.</td></tr>
                      ) : (
                        departments?.map((dept: any) => (
                          <tr key={dept.id}>
                            <td className="org-table-name">{dept.name}</td>
                            <td className="org-table-code">{dept.code || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'designations' && (
          <div className="org-card">
            <div className="org-card-top-bar"></div>
            <div className="org-card-content">
              <div className="org-card-header">
                <div className="org-card-title-group">
                  <div className="org-card-icon-wrapper">
                    <GitBranch size={24} />
                  </div>
                  <div>
                    <h2 className="org-card-title">Designations</h2>
                    <p className="org-card-subtitle">Manage job titles and hierarchy levels</p>
                  </div>
                </div>
                <Button variant="primary" onClick={() => setModalType('designation')}>Add Designation</Button>
              </div>
              {loadingDesigs ? <Spinner /> : (
                <div className="org-table-container">
                  <table className="org-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {designations?.length === 0 ? (
                        <tr><td colSpan={2} style={{ textAlign: 'center', padding: '3rem' }}>No designations found.</td></tr>
                      ) : (
                        designations?.map((desig: any) => (
                          <tr key={desig.id}>
                            <td className="org-table-name">{desig.title}</td>
                            <td className="org-table-code">{desig.code || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Create */}
      {/* Modal for Create */}
      {modalType && (
        <div className="org-modal-overlay">
          {/* Top Bar */}
          <div className="org-modal-header">
            <div className="org-modal-title-group">
              <div className="org-modal-title-indicator" />
              <h2 className="org-modal-title">
                Add {modalType}
              </h2>
            </div>
            <button onClick={closeModals} className="org-modal-close">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="org-modal-form">
            <div className="org-modal-body">
              <div className="org-modal-content-wrapper">
                
                <div className="org-modal-grid">
                  <div className="org-form-group">
                    <label className="org-form-label">
                      Name {modalType === 'designation' && '(Title)'} *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="org-form-input"
                      placeholder={`Enter ${modalType} name`}
                    />
                  </div>
                  
                  <div className="org-form-group">
                    <label className="org-form-label">
                      Code (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="org-form-input"
                      placeholder="e.g., HQ, ENG, SDE"
                    />
                  </div>
                </div>

                {modalType === 'branch' && (
                  <>
                    <div className="org-modal-grid">
                      <div className="org-form-group">
                        <label className="org-form-label">Latitude (Optional)</label>
                        <input 
                          type="number" 
                          step="any"
                          value={formData.latitude}
                          onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                          className="org-form-input"
                          placeholder="e.g., 37.7749"
                        />
                      </div>
                      <div className="org-form-group">
                        <label className="org-form-label">Longitude (Optional)</label>
                        <input 
                          type="number" 
                          step="any"
                          value={formData.longitude}
                          onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                          className="org-form-input"
                          placeholder="e.g., -122.4194"
                        />
                      </div>
                    </div>
                    <p className="org-form-hint">Used for geofenced clock-in & clock-out.</p>

                    <div className="org-checkbox-group">
                      <input 
                        type="checkbox" 
                        id="headOffice"
                        checked={formData.isHeadOffice}
                        onChange={e => setFormData({ ...formData, isHeadOffice: e.target.checked })}
                        className="org-checkbox"
                      />
                      <label htmlFor="headOffice" className="org-checkbox-label">Is Head Office?</label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="org-modal-footer">
              <button type="button" onClick={closeModals} className="org-btn-cancel">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="org-btn-save">
                {createMutation.isPending ? 'Saving...' : `Save ${modalType}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
