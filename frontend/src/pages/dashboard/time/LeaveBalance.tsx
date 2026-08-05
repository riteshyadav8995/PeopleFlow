import React, { useState } from 'react';
import { ChevronDown, MoreVertical, Plus, Info, Loader2, X, FilePlus, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import './LeaveBalance.css';

export function LeaveBalance() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('balance');
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<any>(null);

  const { data: balances, isLoading, error } = useQuery({
    queryKey: ['leaveBalances', organizationId],
    queryFn: async () => {
      const res = await api.get('/leave/balances', { params: { organizationId } });
      return res.data.data;
    },
    enabled: !!organizationId
  });

  if (isLoading) {
    return <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--brand-500)" /></div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--danger-600)', textAlign: 'center' }}>Failed to load leave balances.</div>;
  }

  const safeBalances = balances || [];
  const utilizedLeave = safeBalances.reduce((acc: number, b: any) => acc + (b.usedDays || 0), 0);

  const getLeaveTypeColors = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('sick')) return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', progress: '#ef4444' };
    if (n.includes('casual')) return { bg: '#f0fdfa', text: '#0d9488', border: '#ccfbf1', progress: '#14b8a6' };
    if (n.includes('marriage')) return { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff', progress: '#a855f7' };
    return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', progress: '#64748b' };
  };

  return (
    <div className="leave-balance-container page-container">
      <div className="balance-header">
        <div>
          <h1 className="balance-title">Leave Management</h1>
          <div className="tabs-container">
            <div className={`tab ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>
              Leave Balance
            </div>
            <div className={`tab ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => setActiveTab('holidays')}>
              Holidays List
            </div>
            <div className="tab" onClick={() => navigate('/employee/leave/requests')}>
              History
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/employee/leave/apply')}>
          <FilePlus size={18} /> Request Leave
        </button>
      </div>

      <div>
        {activeTab === 'holidays' && (
          <div className="empty-state-card">
            <Info size={48} className="empty-icon" />
            <h3 className="empty-title">Holidays List</h3>
            <p>Your organization has not published the holiday list for this year yet.</p>
          </div>
        )}
        
        {activeTab === 'balance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Pattern Card */}
            <div className="pattern-card">
              <div>
                <div className="pattern-label">My Leave Pattern</div>
                <div className="pattern-value">{utilizedLeave} Days</div>
              </div>
              <div className="pattern-divider"></div>
              <div className="pattern-bars">
                <div className="pattern-bar" style={{ height: '100%', backgroundColor: 'var(--brand-500)' }}></div>
                <div className="pattern-bar" style={{ height: '60%', backgroundColor: 'var(--warning-500)' }}></div>
                <div className="pattern-bar" style={{ height: '40%', backgroundColor: 'var(--success-500)' }}></div>
                <div className="pattern-bar" style={{ height: '20%', backgroundColor: 'var(--danger-500)' }}></div>
                <div className="pattern-bar" style={{ height: '80%', backgroundColor: 'var(--purple-500)' }}></div>
              </div>
            </div>

            <div>
              <h2 className="balances-section-title">Balance as of Today</h2>
              
              <div className="balances-grid">
                {safeBalances.length === 0 && (
                  <div style={{ padding: '1rem', color: 'var(--gray-500)' }}>No leave balances found.</div>
                )}

                {safeBalances.map((balance: any) => {
                  const available = balance.totalDays - balance.usedDays - balance.pendingDays;
                  const colors = getLeaveTypeColors(balance.leaveType?.name);
                  const usagePercentage = Math.min(100, Math.round((balance.usedDays / balance.totalDays) * 100)) || 0;

                  return (
                    <div key={balance.id} className="balance-card stat-card-compact" style={{ borderLeft: `4px solid ${colors.progress}` }}>
                      <div className="stat-icon" style={{ backgroundColor: colors.bg, color: colors.text }}>
                        <Calendar size={20} />
                      </div>
                      <div className="stat-label-wrap">
                        <span className="stat-label-text">{balance.leaveType?.name}:</span>
                        <span className="stat-value-text">{available} Days</span>
                      </div>
                      <div className="balance-actions" style={{ marginLeft: 'auto' }}>
                        <button 
                          className="btn-icon btn-add" 
                          onClick={() => navigate('/employee/leave/apply', { state: { leaveTypeId: balance.leaveTypeId } })} 
                          style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                        >
                          <Plus size={16}/>
                        </button>
                        <button 
                          className="btn-icon btn-more"
                          onClick={() => setSelectedLeaveDetail(balance)}
                        >
                          <MoreVertical size={16}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLeaveDetail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{selectedLeaveDetail.leaveType?.name} Details</h3>
              <button onClick={() => setSelectedLeaveDetail(null)} className="btn-close"><X size={20}/></button>
            </div>
            
            <div className="modal-details">
              <div className="detail-row">
                <span className="detail-label">Total Allocated</span>
                <span className="detail-value">{selectedLeaveDetail.totalDays} Days</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Used</span>
                <span className="detail-value">{selectedLeaveDetail.usedDays} Days</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pending Approval</span>
                <span className="detail-value warning">{selectedLeaveDetail.pendingDays} Days</span>
              </div>
              <div className="detail-row final">
                <span className="detail-label final">Available Balance</span>
                <span className="detail-value success">
                  {selectedLeaveDetail.totalDays - selectedLeaveDetail.usedDays - selectedLeaveDetail.pendingDays} Days
                </span>
              </div>
            </div>

            <button 
              className="btn-primary modal-action" 
              onClick={() => navigate('/employee/leave/apply', { state: { leaveTypeId: selectedLeaveDetail.leaveTypeId } })}
            >
              Apply for {selectedLeaveDetail.leaveType?.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
