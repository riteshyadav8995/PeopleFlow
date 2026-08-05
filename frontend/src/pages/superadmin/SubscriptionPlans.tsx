import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceMonthly: 0,
    employeeLimit: 10,
    storageLimit: 5,
    isPopular: false
  });

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/superadmin/plans');
      setPlans(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/superadmin/plans', {
        ...formData,
        priceYearly: formData.priceMonthly * 12
      });
      setIsModalOpen(false);
      fetchPlans(); // Refresh list
    } catch (err) {
      console.error('Failed to create plan', err);
      alert('Failed to create plan');
    }
  };

  return (
    <div className="">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Subscription Plans</h1>
          <p className="text-secondary">Manage SaaS tiers and pricing.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create Plan</Button>
      </div>

      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Create New Plan</h2>
            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Plan Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Monthly Price ($)</label>
                  <input type="number" required value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: Number(e.target.value)})} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Employee Limit (0 = unlimited)</label>
                  <input type="number" required value={formData.employeeLimit} onChange={e => setFormData({...formData, employeeLimit: Number(e.target.value)})} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'white' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Storage (GB) (0 = unlimited)</label>
                  <input type="number" required value={formData.storageLimit} onChange={e => setFormData({...formData, storageLimit: Number(e.target.value)})} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'white' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.isPopular} onChange={e => setFormData({...formData, isPopular: e.target.checked})} />
                    <span style={{ fontSize: '0.9rem' }}>Mark as Popular</span>
                  </label>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Plan</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
           <div className="p-8 text-center text-secondary">Loading plans...</div>
        ) : plans.map(plan => (
          <Card key={plan.id} className={plan.isPopular ? 'border-primary' : ''}>
            {plan.isPopular && <div className="text-xs font-bold text-primary mb-2">MOST POPULAR</div>}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-secondary text-sm mb-4">{plan.description}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">${plan.priceMonthly}</span>
              <span className="text-secondary">/mo</span>
            </div>
            
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Employee Limit</span>
                <span className="font-medium">{plan.employeeLimit === 0 ? 'Unlimited' : plan.employeeLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Storage</span>
                <span className="font-medium">{plan.storageLimit === 0 ? 'Unlimited' : `${plan.storageLimit} GB`}</span>
              </div>
            </div>

            <Button variant={plan.isPopular ? 'primary' : 'secondary'} className="w-full">Edit Plan</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
