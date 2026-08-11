import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import './VoiceAgentDashboard.css';

interface CallLog {
  id: string;
  status: string;
  createdAt: string;
  campaign: { name: string };
  candidate?: { firstName: string, lastName: string, email: string, phone: string };
  employee?: { firstName: string, lastName: string, email: string, phone: string };
}

export function VoiceAgentHistory() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCallLogs();
  }, []);

  const fetchCallLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/voice-agent/calls');
      setCallLogs(res.data.data || []);
    } catch (error) {
      console.error('Error fetching call logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        Loading Call History...
      </div>
    );
  }

  return (
    <div className="voice-dashboard-container page-container">
      <div className="voice-hero">
        <div>
          <h1 className="voice-title">
            <span className="voice-title-icon"><History size={32} /></span>
            Voice AI Call History
          </h1>
          <p className="voice-subtitle">
            View the details of all automated voice calls made by the AI agent.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" leftIcon={<ArrowLeft size={18} />} onClick={() => navigate('/organization/voice-agent')} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '2rem' }}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="call-history-section" style={{ marginTop: '1rem' }}>
        <div className="call-history-table-container">
          <table className="call-history-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Email ID</th>
                <th>Mobile No</th>
                <th>Call Initiated</th>
                <th>Received</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.map((log) => {
                const name = log.candidate ? `${log.candidate.firstName} ${log.candidate.lastName}` : (log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : 'Unknown');
                const email = log.candidate?.email || log.employee?.email || 'N/A';
                const phone = log.candidate?.phone || log.employee?.phone || 'N/A';
                const callInitiated = 'Yes';
                const received = (log.status === 'COMPLETED' || log.status === 'ANSWERED' || log.status === 'IN_PROGRESS') ? 'Yes' : 'No';

                return (
                  <tr key={log.id}>
                    <td>{name}</td>
                    <td>{email}</td>
                    <td>{phone}</td>
                    <td>
                      <span className="status-badge success">{callInitiated}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${received === 'Yes' ? 'success' : 'danger'}`}>
                        {received}
                      </span>
                    </td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No calls made yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
