import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Building2, Network, GitBranch, MapPin, X } from 'lucide-react';
import { organizationService } from '@/services/organization.service';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

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
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Organization Settings</h1>
        <p className="text-sm text-slate-500">Manage your company structure and profile.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id 
                ? 'text-brand-600 border-brand-600' 
                : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Company Profile</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-500">Company Name</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                  {user?.tenantId ? 'Tenant ' + user.tenantId.substring(0,6) : 'Acme Corp'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-500">Domain</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">acme.com</div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-500">Administrator Email</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                  {user?.email || 'admin@acme.com'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-500">Current Plan</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 capitalize">Enterprise</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Branches</h2>
              <Button variant="primary" size="sm" onClick={() => setModalType('branch')}>Add Branch</Button>
            </div>
            {loadingBranches ? <Spinner /> : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Name</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Code</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Coordinates</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Head Office</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches?.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-slate-500">No branches found.</td></tr>
                    ) : (
                      branches?.map((branch: any) => (
                        <tr key={branch.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-sm font-medium text-slate-900 border-b border-slate-100">{branch.name}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 border-b border-slate-100">{branch.code || '-'}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 border-b border-slate-100">
                            {branch.latitude && branch.longitude ? `${branch.latitude}, ${branch.longitude}` : 'Not Set'}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 border-b border-slate-100">
                            {branch.isHeadOffice 
                              ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Yes</span> 
                              : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">No</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Departments</h2>
              <Button variant="primary" size="sm" onClick={() => setModalType('department')}>Add Department</Button>
            </div>
            {loadingDepts ? <Spinner /> : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Name</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments?.length === 0 ? (
                      <tr><td colSpan={2} className="text-center py-12 text-slate-500">No departments found.</td></tr>
                    ) : (
                      departments?.map((dept: any) => (
                        <tr key={dept.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-sm font-medium text-slate-900 border-b border-slate-100">{dept.name}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 border-b border-slate-100">{dept.code || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'designations' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Designations</h2>
              <Button variant="primary" size="sm" onClick={() => setModalType('designation')}>Add Designation</Button>
            </div>
            {loadingDesigs ? <Spinner /> : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Title</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designations?.length === 0 ? (
                      <tr><td colSpan={2} className="text-center py-12 text-slate-500">No designations found.</td></tr>
                    ) : (
                      designations?.map((desig: any) => (
                        <tr key={desig.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-sm font-medium text-slate-900 border-b border-slate-100">{desig.title}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 border-b border-slate-100">{desig.code || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Create */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 capitalize">
                Add {modalType}
              </h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Name {modalType === 'designation' && '(Title)'}</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder={`Enter ${modalType} name`}
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Code (Optional)</label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="e.g., HQ, ENG, SDE"
                />
              </div>

              {modalType === 'branch' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700">Latitude (Optional)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={formData.latitude}
                        onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="e.g., 37.7749"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700">Longitude (Optional)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={formData.longitude}
                        onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="e.g., -122.4194"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 -mt-2">Used for geofenced clock-in & clock-out.</p>

                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="headOffice"
                      checked={formData.isHeadOffice}
                      onChange={e => setFormData({ ...formData, isHeadOffice: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="headOffice" className="text-sm font-medium text-slate-700">Is Head Office?</label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Save {modalType}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
