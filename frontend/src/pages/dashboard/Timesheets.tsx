import { useState, useEffect } from 'react';
import { Clock, Calendar, FileText, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import axios from 'axios';

interface Timesheet {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalHours: string;
  employee: {
    firstName: string;
    lastName: string;
  };
}

export function Timesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.get('http://localhost:3000/api/v1/timesheets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimesheets(res.data.data);
    } catch (error) {
      console.error('Error fetching timesheets', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:3000/api/v1/timesheets/log', {
        date: logForm.date,
        hours: parseFloat(logForm.hours),
        description: logForm.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLogging(false);
      setLogForm({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
      // Show mini toast ideally, fallback to alert for simplicity
      alert('Time logged successfully!');
    } catch (error) {
      console.error('Failed to log time', error);
      alert('Failed to log time (check console)');
    }
  };

  const submitNewTimesheet = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:3000/api/v1/timesheets', {
        periodStart: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
        periodEnd: new Date().toISOString(),
        totalHours: 40
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTimesheets();
    } catch (error) {
      console.error('Failed to submit timesheet', error);
      alert('Failed to submit timesheet');
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Hero Section */}
      <div className="flex items-start justify-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-heading" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '1rem', display: 'inline-flex' }}>
               <Clock className="text-success" size={32} />
            </div>
            Timesheets & Tracking
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.6 }}>
            Accurately log your daily hours, review your weekly activity, and submit timesheets for manager approval.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" leftIcon={<FileText size={18} />} onClick={() => setIsLogging(!isLogging)} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.05)' }}>
            Log Hours
          </Button>
          <Button variant="primary" leftIcon={<Send size={18} />} onClick={submitNewTimesheet} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '2rem', background: 'linear-gradient(135deg, var(--success), #059669)', border: 'none', boxShadow: '0 4px 15px var(--success-glow)' }}>
            Submit Timesheet
          </Button>
        </div>
      </div>

      {isLogging && (
        <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
             <div style={{ background: 'var(--success-glow)', padding: '0.5rem', borderRadius: '50%', color: 'var(--success)' }}>
               <Clock size={24} />
             </div>
             <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Log Time Entry</h3>
          </div>
          
          <form onSubmit={handleLogTime} className="flex-col gap-5">
            <div className="flex gap-4">
               <div className="form-group flex-1">
                 <label className="form-label" style={{ color: 'var(--text-heading)' }}>Date</label>
                 <input type="date" className="form-input" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} required value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} />
               </div>
               <div className="form-group flex-1">
                 <label className="form-label" style={{ color: 'var(--text-heading)' }}>Hours</label>
                 <input type="number" step="0.5" className="form-input" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g. 4.5" required value={logForm.hours} onChange={e => setLogForm({...logForm, hours: e.target.value})} />
               </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-heading)' }}>Description</label>
              <textarea className="form-input" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} rows={3} placeholder="What did you work on today?" required value={logForm.description} onChange={e => setLogForm({...logForm, description: e.target.value})}></textarea>
            </div>
            <div className="flex gap-4 justify-end mt-2 pt-4 border-t border-white/10">
              <Button type="button" variant="secondary" onClick={() => setIsLogging(false)}>Cancel</Button>
              <Button type="submit" variant="primary" style={{ background: 'var(--success)', border: 'none', color: '#000' }}>Save Entry</Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-secondary text-center">Loading timesheets...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
             <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Weekly Submissions</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1.25rem 1.5rem' }}>Period</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Employee</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Total Hours</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map(ts => (
                <tr key={ts.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: '0.5rem', color: 'var(--success)' }}>
                        <Calendar size={18} />
                      </div>
                      <span style={{ fontWeight: 500 }}>
                        {new Date(ts.periodStart).toLocaleDateString()} - {new Date(ts.periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{ts.employee?.firstName} {ts.employee?.lastName}</td>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '1.1rem' }}>{ts.totalHours}<span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>h</span></td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`badge ${ts.status === 'MANAGER_APPROVED' ? 'badge-success' : ts.status === 'SUBMITTED' ? 'badge-warning' : 'badge-neutral'}`}>
                      {ts.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {timesheets.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', marginBottom: '1rem' }}>
                      <FileText size={32} />
                    </div>
                    <p>No timesheets found. Submit your first weekly timesheet above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
