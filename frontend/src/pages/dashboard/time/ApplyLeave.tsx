import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, UploadCloud, Info, AlertCircle, Send, Users } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useLocation } from 'react-router-dom';
import './ApplyLeave.css';

export function ApplyLeave() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [leaveTypeId, setLeaveTypeId] = useState(location.state?.leaveTypeId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const queryClient = useQueryClient();

  const organizationId = user?.organizationId;

  // Fetch balances
  const { data: balancesData } = useQuery({
    queryKey: ['leaveBalances', organizationId],
    queryFn: async () => {
      const res = await api.get('/leave/balances', { params: { organizationId } });
      return res.data.data;
    },
    enabled: !!organizationId
  });

  const balances = balancesData || [];

  useEffect(() => {
    if (balances.length > 0 && !leaveTypeId) {
      setLeaveTypeId(balances[0].leaveTypeId);
    }
  }, [balances]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start <= end) {
        let days = 0;
        let current = new Date(start);
        while (current <= end) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days++;
          }
          current.setDate(current.getDate() + 1);
        }
        setCalculatedDays(days);
      } else {
        setCalculatedDays(0);
      }
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate]);

  const submitLeaveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/leave/request', payload);
    },
    onSuccess: () => {
      alert(`Leave application for ${calculatedDays} days submitted successfully!`);
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] });
      setStartDate('');
      setEndDate('');
      setReason('');
      setAttachment(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit leave request');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedDays <= 0) return;
    
    if (!organizationId) {
      alert("Organization ID not found");
      return;
    }

    submitLeaveMutation.mutate({
      leaveTypeId,
      organizationId,
      startDate,
      endDate,
      reason
    });
  };

  const selectedBalance = balances.find((b: any) => b.leaveTypeId === leaveTypeId);
  const availableDays = selectedBalance ? selectedBalance.totalDays - selectedBalance.usedDays - selectedBalance.pendingDays : 0;

  return (
    <div className="apply-leave-container page-container">
      <div className="apply-leave-header">
        <h1 className="apply-leave-title">Apply for Leave</h1>
        <p className="apply-leave-subtitle">Submit a new leave request. Please apply at least 7 days in advance for planned leaves.</p>
      </div>

      <div className="apply-leave-layout">
        
        {/* Main Form */}
        <div className="apply-leave-form-card">
          <form onSubmit={handleSubmit} className="leave-form">
            
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select 
                required
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="form-select"
              >
                {balances.map((b: any) => (
                  <option key={b.leaveTypeId} value={b.leaveTypeId}>
                    {b.leaveType?.name} ({b.totalDays - b.usedDays - b.pendingDays} days available)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <div className="input-with-icon">
                  <CalendarIcon size={18} className="input-icon" />
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">End Date</label>
                <div className="input-with-icon">
                  <CalendarIcon size={18} className="input-icon" />
                  <input 
                    type="date" 
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {calculatedDays > 0 && (
              <div className="calculated-days-alert">
                <Info size={18} />
                <span>You are applying for <strong>{calculatedDays} working days</strong> of leave.</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Reason for Leave</label>
              <textarea 
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a brief reason for your leave application..."
                rows={4}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supporting Document (Optional)</label>
              <div className="upload-zone">
                <UploadCloud size={32} className="upload-icon" />
                <p className="upload-title">Click to upload or drag and drop</p>
                <p className="upload-subtitle">SVG, PNG, JPG or PDF (max. 5MB)</p>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submitLeaveMutation.isPending || calculatedDays <= 0 || calculatedDays > availableDays}
              >
                {submitLeaveMutation.isPending ? 'Submitting...' : <><Send size={18} /> Submit Application</>}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="sidebar-layout">
          
          <div className="policy-card">
            <h3 className="policy-title">
              <AlertCircle size={18} /> Leave Policy Reminder
            </h3>
            <ul className="policy-list">
              <li>Sick leaves require a medical certificate if they exceed 2 consecutive days.</li>
              <li>Planned leave requests should be submitted at least 7 days prior.</li>
              <li>Leave balance is prorated based on joining date.</li>
            </ul>
          </div>

          <div className="balance-card">
            <h3 className="balance-title">Selected Leave Balance</h3>
            
            {selectedBalance ? (
              <div>
                <div className="balance-row">
                  <span className="balance-row-label">Total Allocated</span>
                  <span className="balance-row-value">{selectedBalance.totalDays}</span>
                </div>
                <div className="balance-row">
                  <span className="balance-row-label">Used</span>
                  <span className="balance-row-value">{selectedBalance.usedDays}</span>
                </div>
                <div className="balance-row pending">
                  <span className="balance-row-label">Pending Approval</span>
                  <span className="balance-row-value">{selectedBalance.pendingDays}</span>
                </div>
                <div className="balance-row available">
                  <span className="balance-row-label">Available Balance</span>
                  <span className={`balance-row-value ${availableDays < calculatedDays ? 'insufficient' : 'sufficient'}`}>
                    {availableDays}
                  </span>
                </div>
                
                {availableDays < calculatedDays && (
                  <div className="insufficient-alert">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>Insufficient balance for this request.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-balance">
                Select a leave type to view balance.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
