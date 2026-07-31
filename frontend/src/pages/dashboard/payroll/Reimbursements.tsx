import React, { useState } from 'react';
import { Plus, Search, Filter, Receipt, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { reimbursementService } from '@/services/reimbursement.service';
import { Spinner } from '@/components/ui/Spinner';
import './Reimbursements.css';

export function Reimbursements() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || user?.tenantId || '';
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ category: 'Travel', amount: '', date: '', notes: '' });

  const { data: reimbursements = [], isLoading } = useQuery({
    queryKey: ['myReimbursements', orgId],
    queryFn: () => reimbursementService.getMyClaims(orgId),
    enabled: !!orgId
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => reimbursementService.submitClaim(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReimbursements'] });
      setIsModalOpen(false);
      setFormData({ category: 'Travel', amount: '', date: '', notes: '' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit claim');
    }
  });

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

  const filteredReimbursements = reimbursements.filter((r: any) => 
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="reimbursements-container page-container">
      <div className="reimb-header">
        <div>
          <h1 className="reimb-title">Reimbursements</h1>
          <p className="reimb-subtitle">Track your submitted reimbursement claims and their payment status.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Claim
        </button>
      </div>

      <div className="reimb-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search claims..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn-filter">
          <Filter size={18} /> Filter
        </button>
      </div>

      <div className="reimb-table-card">
        {isLoading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : (
          <div className="table-wrapper">
            <table className="reimb-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Paid On</th>
                  <th style={{ textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredReimbursements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-4 text-gray-500">No claims found.</td>
                  </tr>
                ) : (
                  filteredReimbursements.map((item: any) => (
                    <tr key={item.id}>
                      <td className="td-id">#{item.id.slice(0, 8)}</td>
                      <td className="td-category">{item.category}</td>
                      <td className="td-amount">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount)}
                      </td>
                      <td className="td-date">{new Date(item.date).toLocaleDateString()}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td className="td-paid-on">{item.paidOn ? new Date(item.paidOn).toLocaleDateString() : '-'}</td>
                      <td className="td-action">
                        {item.receiptUrl ? (
                          <button className="btn-receipt">
                            <Receipt size={18} />
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="text-xl font-bold">New Reimbursement Claim</h2>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(formData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="Travel">Travel</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Internet Allowance">Internet Allowance</option>
                  <option value="Team Lunch">Team Lunch</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 1500"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Description</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
