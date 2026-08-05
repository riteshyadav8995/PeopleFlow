import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Shield, Ban, Play, Search, Plus, Filter, HardDrive, Mic, X, Trash2 } from 'lucide-react';

export function Organizations() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ 
    name: '', 
    domain: '', 
    plan: 'trial',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: ''
  });
  const [creating, setCreating] = useState(false);

  const fetchOrganizations = async () => {
    try {
      const { data } = await api.get('/superadmin/organizations');
      setOrganizations(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const reason = prompt('Please provide a reason for this status change:');
    if (!reason) return;

    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await api.patch(`/superadmin/organizations/${id}/status`, { status: newStatus });
      fetchOrganizations();
    } catch (err) {
      console.error(err);
    }
  };

  const impersonate = (id: string) => {
    const reason = prompt('Please provide a reason for the Audited Support Session:');
    if (!reason) return;
    alert(`Started audited support session for Organization ${id}`);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/superadmin/organizations', newOrg);
      setIsModalOpen(false);
      setNewOrg({ name: '', domain: '', plan: 'trial', adminFirstName: '', adminLastName: '', adminEmail: '' });
      fetchOrganizations();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to create organization.';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrg = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete organization '${name}'? This action cannot be undone.`)) {
      try {
        await api.delete(`/superadmin/organizations/${id}`);
        fetchOrganizations();
      } catch (err: any) {
        console.error(err);
        const msg = err.response?.data?.message || 'Failed to delete organization.';
        alert(msg);
      }
    }
  };

  return (
    <div className=" flex-col gap-6" style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header - Fixed layout so button doesn't stretch */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h1 className="text-3xl font-bold mb-1">Organization Management</h1>
          <p className="text-secondary">Manage all platform tenants, subscriptions, and usage limits.</p>
        </div>
        <div style={{ alignSelf: 'center' }}>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
            Create Organization
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-lg border border-soft flex-1 max-w-sm">
          <Search size={18} className="text-secondary" />
          <input type="text" placeholder="Search organizations..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
        <Button variant="secondary" leftIcon={<Filter size={18} />}>Filters</Button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div className="p-12 text-center text-secondary">Loading organizations...</div>
        ) : organizations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
               <Shield className="text-secondary" size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">No organizations found</h3>
             <p className="text-secondary mb-6">No organizations have been created yet.</p>
             <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Create Organization</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-soft bg-gray-100 text-sm font-medium text-secondary">
                  <th className="p-4 pl-6">Organization Name</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Usage</th>
                  <th className="p-4 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr key={org.id} className="border-b border-soft hover:bg-gray-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold">{org.name}</div>
                      <div className="text-xs text-secondary">{org.id.split('-')[0]}...</div>
                    </td>
                    <td className="p-4">
                      {org.tenant?.users?.[0] ? (
                        <>
                          <div className="text-sm">{org.tenant.users[0].firstName} {org.tenant.users[0].lastName}</div>
                          <div className="text-xs text-secondary">{org.tenant.users[0].email}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-secondary italic">No Admin</div>
                          <div className="text-xs text-secondary">admin@{org.tenant?.domain || 'unknown.com'}</div>
                        </>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {org.tenant?.plan?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        org.status === 'active' ? 'bg-success/10 text-success border-success/20' : 
                        org.status === 'trial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {org.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 text-xs text-secondary">
                        <span className="flex items-center gap-1" title="Storage Usage"><HardDrive size={14}/> 45%</span>
                        <span className="flex items-center gap-1" title="AI Voice Usage"><Mic size={14}/> 12%</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => toggleStatus(org.id, org.status)}
                        >
                          {org.status === 'active' ? <Ban size={14} className="mr-1.5"/> : <Play size={14} className="mr-1.5"/>}
                          {org.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                        <Button 
                          variant="primary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none' }}
                          onClick={() => impersonate(org.id)}
                        >
                          <Shield size={14} className="mr-1.5" />
                          Impersonate
                        </Button>
                        <Button 
                          variant="secondary" 
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
                          onClick={() => handleDeleteOrg(org.id, org.name)}
                          title="Delete Organization"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card " style={{ width: '100%', maxWidth: '500px', margin: '1rem', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create New Organization</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-heading p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrg}>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Organization Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Acme Corp" 
                    required
                    value={newOrg.name}
                    onChange={e => setNewOrg({...newOrg, name: e.target.value})}
                  />
                </div>
                
                <div className="form-group flex-1">
                  <label className="form-label">Primary Domain</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="acmecorp.com" 
                    required
                    value={newOrg.domain}
                    onChange={e => setNewOrg({...newOrg, domain: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subscription Plan</label>
                <select 
                  className="form-input"
                  value={newOrg.plan}
                  onChange={e => setNewOrg({...newOrg, plan: e.target.value})}
                >
                  <option value="trial">14-Day Free Trial</option>
                  <option value="startup">Startup Plan</option>
                  <option value="business">Business Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>

              <div className="mt-6 mb-4">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Admin User Profile</h3>
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">First Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="John" 
                    required
                    value={newOrg.adminFirstName}
                    onChange={e => setNewOrg({...newOrg, adminFirstName: e.target.value})}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Doe" 
                    required
                    value={newOrg.adminLastName}
                    onChange={e => setNewOrg({...newOrg, adminLastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Admin Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="admin@acmecorp.com" 
                    required
                    value={newOrg.adminEmail}
                    onChange={e => setNewOrg({...newOrg, adminEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={creating}>Create Organization</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
