import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';
import { X as CloseIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function CreateLeavePolicyModal({ orgId, onClose }: { orgId: string, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    daysPerYear: 10,
    isPaid: true
  });

  const mutation = useMutation({
    mutationFn: (data: any) => leaveService.createLeavePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgLeavePolicies', orgId] });
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create policy');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || formData.daysPerYear < 0) {
      alert('Please fill out all required fields correctly.');
      return;
    }
    mutation.mutate({ ...formData, organizationId: orgId });
  };

  return (
    <div className="leave-modal-overlay">
      <div className="leave-modal-content" style={{ maxWidth: '500px' }}>
        <div className="leave-modal-header">
          <h3 className="leave-card-title">Create Leave Policy</h3>
          <button className="leave-action-btn" onClick={onClose}><CloseIcon size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Policy Name *</label>
            <input 
              type="text" 
              className="leave-search-input" 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Annual Leave"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Policy Code *</label>
            <input 
              type="text" 
              className="leave-search-input" 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              placeholder="e.g. ANNUAL"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
            <textarea 
              className="leave-search-input" 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-primary)', minHeight: '80px' }}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the policy"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Days Per Year *</label>
              <input 
                type="number" 
                className="leave-search-input" 
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                value={formData.daysPerYear}
                onChange={(e) => setFormData({...formData, daysPerYear: Number(e.target.value)})}
                min="0"
                required
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({...formData, isPaid: e.target.checked})}
                />
                Is Paid Leave
              </label>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
