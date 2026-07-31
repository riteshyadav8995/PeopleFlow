import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Play, XCircle, Search, Filter } from 'lucide-react';
import './BackgroundJobs.css';

export function BackgroundJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get('/superadmin/jobs');
        setJobs(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleRetry = async (jobId: string) => {
    try {
      await api.post(`/superadmin/jobs/${jobId}/retry`);
      alert(`Job ${jobId} retry initiated.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await api.post(`/superadmin/jobs/${jobId}/cancel`);
      alert(`Job ${jobId} cancelled.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-jobs-page">
      
      {/* Header */}
      <div className="bj-header">
        <div>
          <h1 className="bj-title">Background Jobs</h1>
          <p className="bj-subtitle">Monitor asynchronous tasks, payroll generation, and bulk email queues.</p>
        </div>
      </div>

      <div className="bj-toolbar">
        <div className="bj-search-wrapper">
          <Search size={18} />
          <input type="text" placeholder="Search jobs by ID or type..." className="bj-search-input" />
        </div>
        <Button variant="secondary" leftIcon={<Filter size={18} />}>Filters</Button>
      </div>

      {/* Table Area */}
      <div className="bj-table-container">
        {loading ? (
          <div className="bj-loading">Loading background jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bj-empty-state">
             <div className="bj-empty-icon-wrapper">
               <XCircle size={32} />
             </div>
             <h3 className="bj-empty-title">Queue is Empty</h3>
             <p className="bj-empty-text">All background jobs have been processed successfully.</p>
          </div>
        ) : (
          <div className="bj-table-wrapper">
            <table className="bj-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem' }}>Job ID / Type</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Last Error</th>
                  <th style={{ paddingRight: '1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td style={{ paddingLeft: '1.5rem' }}>
                      <div className="bj-job-type">{job.type}</div>
                      <div className="bj-job-id">{job.id}</div>
                    </td>
                    <td>{job.organizationId || 'Global'}</td>
                    <td>
                      <span className={`badge badge-${
                        job.status === 'FAILED' ? 'danger' : 
                        job.status === 'RUNNING' ? 'info' :
                        'success'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{job.attempts} / 3</td>
                    <td className="bj-error-text">{job.lastError || '-'}</td>
                    <td style={{ paddingRight: '1.5rem' }}>
                      <div className="bj-actions">
                        {job.status === 'FAILED' && (
                          <Button variant="secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleRetry(job.id)}>
                            <Play size={14} className="mr-1.5"/> Retry
                          </Button>
                        )}
                        {job.status === 'QUEUED' && (
                          <Button variant="secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleCancel(job.id)}>
                            Cancel
                          </Button>
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
