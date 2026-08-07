import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './AttendanceCorrections.css';

export function AttendanceCorrections() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    requestedClockIn: '',
    requestedClockOut: '',
    reason: ''
  });

  const { data: corrections = [], isLoading } = useQuery({
    queryKey: ['attendance-corrections', user?.organizationId],
    queryFn: async () => {
      const res = await api.get(`/attendance/corrections?organizationId=${user?.organizationId}`);
      return res.data.data;
    },
    enabled: !!user?.organizationId
  });

  const createCorrection = useMutation({
    mutationFn: async (data: any) => {
      // Combine date and time to valid datetime strings
      const payload = {
        date: data.date,
        requestedClockIn: new Date(`${data.date}T${data.requestedClockIn}`).toISOString(),
        requestedClockOut: data.requestedClockOut ? new Date(`${data.date}T${data.requestedClockOut}`).toISOString() : null,
        reason: data.reason
      };
      return api.post('/attendance/corrections', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-corrections'] });
      setIsModalOpen(false);
      alert('Correction request submitted successfully!');
    },
    onError: (err: any) => {
      alert(`Failed to submit: ${err.response?.data?.message || err.message}`);
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="px-2 py-1 bg-success-50 text-success rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-danger-50 text-danger rounded-full text-xs font-medium flex items-center gap-1"><XCircle size={12}/> Rejected</span>;
      default: return <span className="px-2 py-1 bg-warning-50 text-warning rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle size={12}/> Pending</span>;
    }
  };

  return (
    <div className="ac-page-container p-8 max-w-7xl mx-auto">
      <div className="ac-header flex justify-between items-center mb-8">
        <div>
          <h1 className="ac-page-title text-3xl font-bold">Attendance Corrections</h1>
          <p className="ac-page-subtitle text-subtle mt-2">Submit and track your attendance punch corrections.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="ac-btn-raise">
          <Plus size={18} className="mr-2" />
          Raise Correction
        </Button>
      </div>

      <Card>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-10 text-subtle">Loading corrections...</div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-10 text-subtle">You have no correction requests.</div>
          ) : (
            <div className="ac-table-container">
              <table className="ac-table w-full text-left">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Requested Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Submitted On</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((corr: any, idx: number) => (
                    <tr key={corr.id} className="ac-table-row" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <td className="font-medium text-primary">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-brand-500" />
                          {new Date(corr.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div className="ac-time-block">
                          <span className="ac-time-in">In: {new Date(corr.requestedClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {corr.requestedClockOut && <span className="ac-time-out">Out: {new Date(corr.requestedClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      </td>
                      <td className="max-w-xs truncate" title={corr.reason}>{corr.reason}</td>
                      <td>{getStatusBadge(corr.status)}</td>
                      <td className="text-subtle text-sm">{new Date(corr.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {isModalOpen && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-content">
            <div className="ac-modal-header">
              <h2 className="ac-modal-title">Raise Correction</h2>
              <button onClick={() => setIsModalOpen(false)} className="ac-modal-close">
                <XCircle size={22} />
              </button>
            </div>
            
            <div className="ac-modal-body">
              <div className="ac-form-group">
                <label className="ac-form-label">Date <span>*</span></label>
                <input 
                  type="date" 
                  className="ac-form-input"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="ac-grid-2">
                <div className="ac-form-group">
                  <label className="ac-form-label">Clock In Time <span>*</span></label>
                  <input 
                    type="time" 
                    className="ac-form-input"
                    value={formData.requestedClockIn}
                    onChange={e => setFormData({ ...formData, requestedClockIn: e.target.value })}
                    required
                  />
                </div>
                <div className="ac-form-group">
                  <label className="ac-form-label">Clock Out Time</label>
                  <input 
                    type="time" 
                    className="ac-form-input"
                    value={formData.requestedClockOut}
                    onChange={e => setFormData({ ...formData, requestedClockOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="ac-form-group">
                <label className="ac-form-label">Reason <span>*</span></label>
                <textarea 
                  className="ac-form-textarea"
                  rows={3}
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  required
                  placeholder="E.g., Forgot to clock in, system issue..."
                />
              </div>
            </div>

            <div className="ac-modal-footer">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={() => createCorrection.mutate(formData)}
                isLoading={createCorrection.isPending}
                disabled={!formData.date || !formData.requestedClockIn || !formData.reason}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
