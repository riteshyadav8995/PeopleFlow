import React, { useState } from 'react';
import { MonitorSmartphone, CheckCircle, XCircle, AlertCircle, Laptop } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../../../services/asset.service';
import './TeamAssets.css';

export function TeamAssets() {
  const queryClient = useQueryClient();

  const { data: rawRequests, isLoading } = useQuery({
    queryKey: ['teamAssetRequests'],
    queryFn: () => assetService.getTeamRequests()
  });

  const requests = rawRequests ? rawRequests.map((r: any) => ({
    id: r.id,
    employee: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Unknown',
    assetType: r.assetType,
    assetName: r.assetName,
    reason: r.reason,
    date: r.createdAt.split('T')[0],
    status: r.status.toLowerCase(),
    cost: r.cost ? `$${r.cost}` : 'TBD'
  })) : [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => assetService.updateRequestStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamAssetRequests'] });
      showSuccess(`Asset request ${variables.status}!`);
    }
  });

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    updateStatusMutation.mutate({ id, status: action });
  };

  const pending = requests.filter(r => r.status === 'pending');
  const history = requests.filter(r => r.status !== 'pending');
  const displayed = activeTab === 'pending' ? pending : history;

  return (
    <div className="ta-container">
      {successMsg && <div className="tg-success-toast">{successMsg}</div>}

      <div className="oon-header">
        <div>
          <h1 className="oon-title"><MonitorSmartphone size={22} /> Team Assets</h1>
          <p className="oon-subtitle">Review asset requests from your team members.</p>
        </div>
        <div className="ac-count-badge">{pending.length} Pending</div>
      </div>

      <div className="oon-tabs">
        <button className={`oon-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <AlertCircle size={14} /> Pending ({pending.length})
        </button>
        <button className={`oon-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <CheckCircle size={14} /> History ({history.length})
        </button>
      </div>

      <div className="oon-list">
        {displayed.length === 0 && (
          <div className="goals-empty"><Laptop size={40} strokeWidth={1} /><p>No {activeTab} requests.</p></div>
        )}
        {displayed.map(r => (
          <div key={r.id} className="ta-card">
            <div className="ta-card-header">
              <div className="ta-card-info">
                <div className="pr-avatar">{r.employee.charAt(0)}</div>
                <div>
                  <h3 className="oon-card-name">{r.employee}</h3>
                  <p className="oon-card-type">{r.assetType} • {r.assetName}</p>
                </div>
              </div>
              <div className="ta-card-cost">{r.cost}</div>
            </div>
            <p className="ac-reason"><strong>Reason:</strong> {r.reason}</p>
            <div className="ta-card-footer">
              <span className="oon-card-date">{r.date}</span>
              {r.status === 'pending' ? (
                <div className="ac-actions">
                  <button className="ac-btn ac-btn-approve" onClick={() => handleAction(r.id, 'approved')}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button className="ac-btn ac-btn-reject" onClick={() => handleAction(r.id, 'rejected')}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              ) : (
                <span className={`pr-status-badge ${r.status === 'approved' ? 'pr-status-completed' : 'pr-status-pending'}`}>
                  {r.status === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
