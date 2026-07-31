import React, { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle, FileText, Banknote } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { reimbursementService } from '@/services/reimbursement.service';
import { Spinner } from '@/components/ui/Spinner';
import './AdminReimbursements.css';

export function AdminReimbursements() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || user?.tenantId || '';
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['allReimbursements', orgId],
    queryFn: () => reimbursementService.getAllClaims(orgId),
    enabled: !!orgId
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: string, notes?: string }) => 
      reimbursementService.updateClaimStatus(orgId, id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReimbursements'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update status')
  });

  const handleApprove = (id: string) => updateStatusMutation.mutate({ id, status: 'APPROVED' });
  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason !== null) {
      updateStatusMutation.mutate({ id, status: 'REJECTED', notes: reason });
    }
  };
  const handleMarkPaid = (id: string) => updateStatusMutation.mutate({ id, status: 'PAID' });

  const getStatusBadge = (status: string) => {
    switch(status.toUpperCase()) {
      case 'PAID': 
      case 'APPROVED': 
        return <span className="status-badge success"><CheckCircle size={14} /> {status}</span>;
      case 'PENDING': 
        return <span className="status-badge pending"><Clock size={14} /> Pending</span>;
      case 'REJECTED': 
        return <span className="status-badge danger"><XCircle size={14} /> Rejected</span>;
      default: 
        return null;
    }
  };

  const filteredClaims = claims.filter((c: any) => 
    c.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="reimbursements-container">
      <div className="reimbursements-header">
        <div className="reimbursements-title-wrapper">
          <h1 className="reimbursements-title">
            <div className="reimbursements-icon-wrapper">
              <Banknote size={24} />
            </div>
            Reimbursement Claims
          </h1>
          <p className="reimbursements-subtitle">Review and approve employee reimbursement claims.</p>
        </div>
      </div>

      <div className="reimbursements-data-section">
        <div className="data-section-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            </div>
            <h3 className="empty-title">Loading claims...</h3>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <FileText className="empty-icon" size={32} />
            </div>
            <h3 className="empty-title">No claims found</h3>
            <p className="empty-subtitle">We couldn't find any reimbursement claims matching your criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="reimbursements-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((item: any) => (
                  <tr key={item.id} className="table-row">
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {item.employee?.firstName?.charAt(0)}{item.employee?.lastName?.charAt(0)}
                        </div>
                        <div className="employee-info">
                          <div className="employee-name">
                            {item.employee?.firstName} {item.employee?.lastName}
                          </div>
                          <div className="employee-id">ID: {item.employee?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="category-name">{item.category}</div>
                      <div className="category-notes">{item.notes}</div>
                    </td>
                    <td className="val-amount">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount)}
                    </td>
                    <td className="val-date">{new Date(item.date).toLocaleDateString()}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className="action-buttons">
                        {item.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleApprove(item.id)}
                              className="btn-approve"
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(item.id)}
                              className="btn-reject"
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        {item.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleMarkPaid(item.id)}
                            className="btn-mark-paid"
                            disabled={updateStatusMutation.isPending}
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
