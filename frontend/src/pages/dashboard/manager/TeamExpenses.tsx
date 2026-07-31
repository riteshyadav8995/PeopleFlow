import React, { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, AlertCircle, Receipt, Calendar } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reimbursementService } from '../../../services/reimbursement.service';
import './TeamExpenses.css';

export function TeamExpenses() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const queryClient = useQueryClient();

  const { data: rawExpenses, isLoading } = useQuery({
    queryKey: ['teamExpenses', organizationId],
    queryFn: () => reimbursementService.getTeamClaims(organizationId),
    enabled: !!organizationId
  });

  const expenses = rawExpenses ? rawExpenses.map((e: any) => ({
    id: e.id,
    employee: e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : 'Unknown',
    category: e.category,
    amount: e.currency ? `${e.currency} ${e.amount}` : `$${e.amount}`,
    date: e.date.split('T')[0],
    description: e.notes || 'No description',
    status: e.status.toLowerCase()
  })) : [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => reimbursementService.updateClaimStatus(id, status.toUpperCase()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamExpenses', organizationId] });
      showSuccess(`Expense ${variables.status}!`);
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

  const pending = expenses.filter(e => e.status === 'pending');
  const history = expenses.filter(e => e.status !== 'pending');
  const displayed = activeTab === 'pending' ? pending : history;

  return (
    <div className="te-container">
      {successMsg && (
        <div className="te-toast">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <div className="te-header">
        <div className="te-title-wrapper">
          <h1 className="te-title">
            <CreditCard size={28} className="te-title-icon" /> 
            Team Expense Approvals
          </h1>
          <p className="te-subtitle">Review and approve/reject expense claims from your team.</p>
        </div>
        <div className="te-badge">
          {pending.length} Pending
        </div>
      </div>

      <div className="te-tabs">
        <button 
          className={`te-tab ${activeTab === 'pending' ? 'active' : ''}`} 
          onClick={() => setActiveTab('pending')}
        >
          <AlertCircle size={16} /> Pending ({pending.length})
        </button>
        <button 
          className={`te-tab ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => setActiveTab('history')}
        >
          <CheckCircle size={16} /> History ({history.length})
        </button>
      </div>

      <div className="te-list">
        {displayed.length === 0 && (
          <div className="te-empty">
            <Receipt size={48} strokeWidth={1} />
            <p>No {activeTab} expenses found.</p>
          </div>
        )}
        {displayed.map(e => (
          <div key={e.id} className="te-card">
            <div className="te-card-header">
              <div className="te-user-info">
                <div className="te-avatar">{e.employee.charAt(0)}</div>
                <div className="te-user-details">
                  <h3 className="te-user-name">{e.employee}</h3>
                  <p className="te-category">{e.category}</p>
                </div>
              </div>
              <div className="te-amount">{e.amount}</div>
            </div>
            
            <div className="te-description">
              <strong>Description:</strong> {e.description}
            </div>
            
            <div className="te-card-footer">
              <span className="te-date">
                <Calendar size={14} /> {e.date}
              </span>
              
              {e.status === 'pending' ? (
                <div className="te-actions">
                  <button className="te-btn te-btn-approve" onClick={() => handleAction(e.id, 'approved')}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="te-btn te-btn-reject" onClick={() => handleAction(e.id, 'rejected')}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              ) : (
                <span className={`te-status ${e.status}`}>
                  {e.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {e.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
