import React from 'react';
import { Laptop, Mouse, Monitor, ChevronRight } from 'lucide-react';
import './MyAssets.css';

export function MyAssets() {
  const [assets, setAssets] = React.useState(() => {
    const saved = localStorage.getItem('my_assets');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'AST-LPT-042', name: 'MacBook Pro 16"', type: 'Laptop', issueDate: '15 Jan 2024', status: 'Assigned', icon: 'Laptop' },
      { id: 'AST-MON-118', name: 'Dell UltraSharp 27"', type: 'Monitor', issueDate: '15 Jan 2024', status: 'Assigned', icon: 'Monitor' },
      { id: 'AST-MOU-056', name: 'Logitech MX Master 3', type: 'Accessory', issueDate: '15 Jan 2024', status: 'Assigned', icon: 'Mouse' },
    ];
  });

  const [showModal, setShowModal] = React.useState(false);
  const [requestForm, setRequestForm] = React.useState({ type: 'Laptop', name: '', reason: '' });

  // Map string icon names to Lucide components
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop size={24} />;
      case 'Monitor': return <Monitor size={24} />;
      case 'Mouse': return <Mouse size={24} />;
      default: return <Laptop size={24} />; // fallback
    }
  };

  const handleRequestSubmit = () => {
    if (!requestForm.name || !requestForm.reason) return alert('Please fill all fields');
    
    const newAsset = {
      id: `REQ-${Math.floor(Math.random() * 10000)}`,
      name: requestForm.name,
      type: requestForm.type,
      issueDate: 'Pending',
      status: 'Pending',
      icon: requestForm.type
    };

    const updatedAssets = [newAsset, ...assets];
    setAssets(updatedAssets);
    localStorage.setItem('my_assets', JSON.stringify(updatedAssets));
    
    setShowModal(false);
    setRequestForm({ type: 'Laptop', name: '', reason: '' });
  };

  return (
    <div className="my-assets-container page-container" style={{ position: 'relative' }}>
      <div className="assets-header">
        <h1 className="assets-title">My Assets</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          Request Asset
        </button>
      </div>

      <div className="assets-grid">
        {assets.map((asset: any) => (
          <div key={asset.id} className="asset-card animate-fade-in">
            <div className="asset-card-header">
              <div className="asset-icon-wrapper">
                {getIcon(asset.icon)}
              </div>
              <span className={`status-badge ${asset.status === 'Pending' ? 'badge-warning' : ''}`} style={asset.status === 'Pending' ? { background: 'var(--warning-100)', color: 'var(--warning-700)' } : {}}>
                {asset.status}
              </span>
            </div>
            
            <div className="asset-details">
              <div className="asset-name">{asset.name}</div>
              <div className="asset-id">{asset.status === 'Pending' ? 'Request ID:' : 'Asset ID:'} {asset.id}</div>
            </div>

            <div className="asset-footer">
              <div>
                <div className="issue-label">{asset.status === 'Pending' ? 'Requested On' : 'Issued On'}</div>
                <div className="issue-date">{asset.status === 'Pending' ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : asset.issueDate}</div>
              </div>
              <button className="btn-details">
                Details <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="animate-fade-in" style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-xl)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Request New Asset</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Asset Type</label>
              <select className="profile-input" style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} value={requestForm.type} onChange={e => setRequestForm({...requestForm, type: e.target.value})}>
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Mouse">Mouse / Accessory</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Specific Model / Name</label>
              <input type="text" className="profile-input" style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} placeholder="e.g. Magic Keyboard" value={requestForm.name} onChange={e => setRequestForm({...requestForm, name: e.target.value})} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Reason for Request</label>
              <textarea className="profile-input" style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', minHeight: '80px', resize: 'vertical' }} placeholder="Why do you need this asset?" value={requestForm.reason} onChange={e => setRequestForm({...requestForm, reason: e.target.value})}></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleRequestSubmit}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
