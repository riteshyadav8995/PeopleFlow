import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { 
  Briefcase, Users, Plus, Target, Building2, 
  Clock, CheckCircle2, Calendar, X, FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import './RecruitmentDashboard.css';

interface JobPosting {
  id: string;
  title: string;
  jobCode: string;
  status: string;
  employmentType: string;
  workMode: string;
  positions: number;
  applicationDeadline?: string;
  department?: { name: string };
}

interface Application {
  id: string;
  stage: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  job: {
    title: string;
  };
  appliedAt: string;
}

type Tab = 'overview' | 'jobs' | 'pipeline';

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

const stageColor: Record<string, string> = {
  APPLIED: '#6366f1',
  SCREENING: '#f59e0b',
  INTERVIEW: '#3b82f6',
  OFFER: '#8b5cf6',
  HIRED: '#10b981',
  REJECTED: '#ef4444',
};

export function RecruitmentDashboard() {
  const { user } = useAuthStore();
  const organizationId = (user as any)?.organizationId || '';
  const isAdmin = user?.roles.includes('tenant_admin') || user?.roles.includes('super_admin');

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [jobForm, setJobForm] = useState({
    title: '',
    employmentType: 'full_time',
    workMode: 'office',
    positions: 1,
    experienceMin: 0,
    experienceMax: 5,
    publicDescription: '',
    applicationDeadline: '',
    status: 'PUBLISHED',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const jobsRes = await api.get('/recruitment/jobs', { params: { organizationId } });
      setJobs(jobsRes.data.data || []);
    } catch { setJobs([]); }
    try {
      const appsRes = await api.get('/recruitment/applications', { params: { organizationId } });
      setApplications(appsRes.data.data || []);
    } catch { setApplications([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (organizationId) fetchData();
  }, [organizationId]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/recruitment/jobs', {
        ...jobForm,
        organizationId,
        positions: Number(jobForm.positions),
        experienceMin: Number(jobForm.experienceMin),
        experienceMax: Number(jobForm.experienceMax),
        applicationDeadline: jobForm.applicationDeadline || null,
      });
      setIsJobModalOpen(false);
      setMessage('Job posted successfully!');
      setJobForm({ title: '', employmentType: 'full_time', workMode: 'office', positions: 1, experienceMin: 0, experienceMax: 5, publicDescription: '', applicationDeadline: '', status: 'PUBLISHED' });
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to create job.');
    } finally {
      setSaving(false);
    }
  };

  const updateApplicationStage = async (appId: string, newStage: string) => {
    try {
      await api.patch(`/recruitment/applications/${appId}/stage`, { stage: newStage });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, stage: newStage } : a));
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, stage: newStage } : null);
      }
      setMessage(`Moved candidate to ${newStage}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const openJobs = jobs.filter(j => j.status === 'PUBLISHED').length;
  const totalApps = applications.length;
  const hiredCount = applications.filter(a => a.stage === 'HIRED').length;
  const inInterviewCount = applications.filter(a => a.stage === 'INTERVIEW').length;

  return (
    <div className="recruitment-container page-container">
      {/* Hero */}
      <div className="recruitment-hero">
        <div>
          <h1 className="recruitment-title">
            <span className="recruitment-title-icon"><Briefcase size={32} /></span>
            Applicant Tracking System
          </h1>
          <p className="recruitment-subtitle">
            Publish job postings, source top talent, and manage candidates through the hiring pipeline.
          </p>
        </div>
        {isAdmin && (
          <button className="btn-post-job" onClick={() => setIsJobModalOpen(true)}>
            <Plus size={18} /> Post New Job
          </button>
        )}
      </div>

      {message && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--success-glow)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="recruitment-stats">
        <div className="stat-card pink">
          <div className="stat-icon pink"><Briefcase size={26} /></div>
          <div>
            <p className="stat-label">Open Positions</p>
            <div className="stat-value">{openJobs}</div>
          </div>
        </div>
        <div className="stat-card brand">
          <div className="stat-icon brand"><Users size={26} /></div>
          <div>
            <p className="stat-label">Total Applicants</p>
            <div className="stat-value">{totalApps}</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon success"><CheckCircle2 size={26} /></div>
          <div>
            <p className="stat-label">Hires This Cycle</p>
            <div className="stat-value">{hiredCount}</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning"><Calendar size={26} /></div>
          <div>
            <p className="stat-label">In Interview Stage</p>
            <div className="stat-value">{inInterviewCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="recruitment-tabs">
        <button className={`recruitment-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <Target size={16} /> Overview
        </button>
        <button className={`recruitment-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
          <Briefcase size={16} /> Job Openings
        </button>
        <button className={`recruitment-tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
          <Users size={16} /> Candidate Pipeline
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="recruitment-grid">
          {/* Jobs Column */}
          <div className="content-card">
            <div className="content-card-header">
              <span className="content-card-title">Active Job Postings</span>
              <span className="content-card-count">{jobs.length} total</span>
            </div>
            <div className="content-card-body">
              {loading ? (
                <p className="list-empty">Loading...</p>
              ) : jobs.length === 0 ? (
                <p className="list-empty">No jobs posted yet. Click "Post New Job" to get started.</p>
              ) : (
                jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="job-item">
                    <div className="job-item-header">
                      <span className="job-title">{job.title}</span>
                      <span className={`badge badge-${job.status === 'PUBLISHED' ? 'success' : 'neutral'}`}>{job.status}</span>
                    </div>
                    <div className="job-meta">
                      {job.department && <span className="job-meta-item"><Building2 size={12} /> {job.department.name}</span>}
                      <span className="job-meta-item"><Target size={12} /> {job.employmentType.replace('_', ' ')}</span>
                      <span className="job-meta-item"><Users size={12} /> {job.positions} position(s)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Candidates Column */}
          <div className="content-card">
            <div className="content-card-header">
              <span className="content-card-title">Recent Applicants</span>
              <span className="content-card-count">{applications.length} total</span>
            </div>
            <div className="content-card-body">
              {loading ? (
                <p className="list-empty">Loading...</p>
              ) : applications.length === 0 ? (
                <p className="list-empty">No candidates in pipeline yet.</p>
              ) : (
                applications.slice(0, 6).map(app => (
                  <div key={app.id} className="candidate-item">
                    <div className="candidate-info">
                      <div className="candidate-avatar">
                        {app.candidate.firstName.charAt(0)}{app.candidate.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="candidate-name">{app.candidate.firstName} {app.candidate.lastName}</div>
                        <div className="candidate-email">{app.job.title}</div>
                      </div>
                    </div>
                    <span className={`badge badge-${app.stage === 'HIRED' ? 'success' : app.stage === 'REJECTED' ? 'danger' : 'warning'}`}>
                      {app.stage}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="content-card">
          <div className="content-card-header">
            <span className="content-card-title">All Job Openings</span>
            {isAdmin && (
              <button className="btn-post-job" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }} onClick={() => setIsJobModalOpen(true)}>
                <Plus size={14} /> New Job
              </button>
            )}
          </div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Job Title', 'Code', 'Type', 'Mode', 'Positions', 'Status', 'Deadline'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : jobs.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No jobs found.</td></tr>
                ) : (
                  jobs.map(job => (
                    <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                      onMouseOut={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{job.title}</td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{job.jobCode}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>{job.employmentType.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>{job.workMode}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>{job.positions}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge badge-${job.status === 'PUBLISHED' ? 'success' : job.status === 'CLOSED' ? 'neutral' : 'warning'}`}>{job.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline Tab - Kanban Board */}
      {activeTab === 'pipeline' && (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Users size={16} /> Drag-free Kanban — click a card to move it to the next stage
          </div>
          <div className="pipeline-container">
            {STAGES.map(stage => {
              const stageApps = applications.filter(a => a.stage === stage);
              return (
                <div key={stage} className="pipeline-column" style={{ borderTop: `3px solid ${stageColor[stage]}` }}>
                  <div className="pipeline-column-header">
                    <span className="pipeline-column-title" style={{ color: stageColor[stage] }}>{stage}</span>
                    <span className="pipeline-count">{stageApps.length}</span>
                  </div>
                  {stageApps.map(app => {
                    const nextStageIdx = STAGES.indexOf(stage) + 1;
                    const nextStage = STAGES[nextStageIdx];
                    return (
                      <div key={app.id} className="pipeline-card"
                        title="Click to view details"
                        onClick={() => setSelectedApp(app)}
                      >
                        <div className="pipeline-card-name">{app.candidate.firstName} {app.candidate.lastName}</div>
                        <div className="pipeline-card-role">{app.job.title}</div>
                      </div>
                    );
                  })}
                  {stageApps.length === 0 && (
                    <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {isJobModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Post New Job Opening</h2>
              <button className="modal-close" onClick={() => setIsJobModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" required placeholder="e.g. Senior Frontend Engineer" value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Employment Type</label>
                    <select className="form-select" value={jobForm.employmentType} onChange={e => setJobForm(p => ({ ...p, employmentType: e.target.value }))}>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Mode</label>
                    <select className="form-select" value={jobForm.workMode} onChange={e => setJobForm(p => ({ ...p, workMode: e.target.value }))}>
                      <option value="office">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">No. of Positions</label>
                    <input type="number" className="form-input" min={1} value={jobForm.positions} onChange={e => setJobForm(p => ({ ...p, positions: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Application Deadline</label>
                    <input type="date" className="form-input" value={jobForm.applicationDeadline} onChange={e => setJobForm(p => ({ ...p, applicationDeadline: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min. Experience (yrs)</label>
                    <input type="number" className="form-input" min={0} value={jobForm.experienceMin} onChange={e => setJobForm(p => ({ ...p, experienceMin: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max. Experience (yrs)</label>
                    <input type="number" className="form-input" min={0} value={jobForm.experienceMax} onChange={e => setJobForm(p => ({ ...p, experienceMax: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Description (Public)</label>
                  <textarea className="form-textarea" placeholder="Describe the role, responsibilities, and requirements..." value={jobForm.publicDescription} onChange={e => setJobForm(p => ({ ...p, publicDescription: e.target.value }))} rows={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Publish Status</label>
                  <select className="form-select" value={jobForm.status} onChange={e => setJobForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="PUBLISHED">Publish Now</option>
                    <option value="DRAFT">Save as Draft</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-modal" onClick={() => setIsJobModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-post-job" style={{ borderRadius: 'var(--radius-md)', padding: '0.625rem 1rem' }} disabled={saving}>
                  {saving ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Application Details</h2>
              <button className="modal-close" onClick={() => setSelectedApp(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {selectedApp.candidate.firstName} {selectedApp.candidate.lastName}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedApp.candidate.email}</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Applied For</p>
                  <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedApp.job.title}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Current Stage</p>
                  <select 
                    style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                    value={selectedApp.stage}
                    onChange={(e) => updateApplicationStage(selectedApp.id, e.target.value)}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {(selectedApp as any).resumeUrl && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Resume</h4>
                  <a href={(selectedApp as any).resumeUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 500 }}>
                    View Resume Document
                  </a>
                </div>
              )}

              {(selectedApp as any).coverLetter && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Cover Letter</h4>
                  <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {(selectedApp as any).coverLetter}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
