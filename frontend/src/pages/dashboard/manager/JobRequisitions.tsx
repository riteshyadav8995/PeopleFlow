import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Users, Search, MoreVertical, MapPin, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import './JobRequisitions.css';

interface Requisition {
  id: string;
  title?: string;
  jobTitle?: string;
  departmentId?: string;
  status: string;
  positions?: number;
  reason?: string;
  createdAt: string;
  department?: { name: string };
}

export function JobRequisitions() {
  const { user } = useAuthStore();
  const organizationId = (user as any)?.organizationId || '';
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', positions: 1, reason: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruitment/requisitions', { params: { organizationId } });
      setRequisitions(res.data.data || []);
    } catch { setRequisitions([]); }
    setLoading(false);
  };

  useEffect(() => { if (organizationId) fetchData(); }, [organizationId]);

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/recruitment/requisitions', { ...form, organizationId, positions: Number(form.positions) });
      setIsModalOpen(false);
      setForm({ title: '', positions: 1, reason: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create requisition.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = requisitions.filter(r =>
    (r.title || r.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = requisitions.filter(r => r.status === 'APPROVED' || r.status === 'OPEN').length;
  const pendingCount = requisitions.filter(r => r.status === 'PENDING').length;

  return (
    <div className="job-req-container">
      {/* Header */}
      <div className="job-req-header">
        <div>
          <h1 className="job-req-title">
            <Briefcase color="var(--brand-600)" />
            Job Requisitions
          </h1>
          <p className="job-req-subtitle">Manage open roles and track hiring progress for your team.</p>
        </div>
        <div className="job-req-actions">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search roles..."
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            New Requisition
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-row">
        {[
          { label: 'Active Roles', value: activeCount, icon: Briefcase, variant: 'brand' },
          { label: 'Total Requisitions', value: requisitions.length, icon: Users, variant: 'success' },
          { label: 'Pending Approvals', value: pendingCount, icon: Clock, variant: 'warning' },
          { label: 'Avg. Time to Hire', value: '—', icon: ArrowRight, variant: 'info' },
        ].map((metric, i) => (
          <div key={i} className="metric-card">
            <div className={`metric-icon-box ${metric.variant}`}>
              <metric.icon size={24} />
            </div>
            <div className="metric-details">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="req-grid">
        {loading ? (
          <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No requisitions found. Click "New Requisition" to create one.
          </div>
        ) : (
          filtered.map(req => (
            <div key={req.id} className="req-card">
              <div className="req-card-header">
                <div>
                  <span className={`req-status ${req.status.toLowerCase()}`}>{req.status}</span>
                  <h3 className="req-card-title">{req.title || req.jobTitle || 'Untitled Role'}</h3>
                  <p className="req-card-dept">{req.department?.name || 'General'}</p>
                </div>
                <button className="req-more-btn"><MoreVertical size={20} /></button>
              </div>
              <div className="req-card-body">
                <div className="req-details-list">
                  <div className="req-detail-item">
                    <Briefcase size={16} />
                    {req.positions || 1} Position(s)
                  </div>
                  <div className="req-detail-item">
                    <Clock size={16} />
                    {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="req-card-footer">
                  <div className="req-applicants">
                    <Users size={16} color="var(--brand-600)" />
                    <span style={{ fontWeight: 700 }}>{req.positions || 0}</span> Openings
                  </div>
                  <button className="req-view-btn">
                    View Pipeline <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Requisition Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>New Job Requisition</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={handleCreateRequisition}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Role Title *</label>
                  <input style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none' }} required placeholder="e.g. Senior React Developer" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Positions Needed</label>
                  <input type="number" min={1} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none' }} value={form.positions} onChange={e => setForm(p => ({ ...p, positions: Number(e.target.value) }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Business Justification</label>
                  <textarea style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none', resize: 'vertical', minHeight: '80px' }} placeholder="Reason for this position..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--gray-50)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.625rem 1rem', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit Requisition'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
