import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { 
  Briefcase, Users, Plus, Target, Building2, 
  Clock, CheckCircle2, Calendar, X, FileText,
  MoreVertical, Edit2, Trash2, PhoneCall
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
  experienceMin?: number;
  experienceMax?: number;
  publicDescription?: string;
}

interface Application {
  id: string;
  stage: string;
  candidate: {
    id: string;
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

  // AI Calling State
  const [isAICallModalOpen, setIsAICallModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [candidateToCall, setCandidateToCall] = useState<Application | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [calling, setCalling] = useState(false);
  const [callMethod, setCallMethod] = useState<'MOBILE' | 'BROWSER'>('BROWSER');

  const [activeJobMenu, setActiveJobMenu] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);

  const [jobForm, setJobForm] = useState({
    id: null as string | null,
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveJobMenu(null);
    if (activeJobMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeJobMenu]);

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
    if (organizationId) {
      fetchData();
      fetchCampaigns();
    }
  }, [organizationId]);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/voice-agent/campaigns');
      setCampaigns(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedCampaignId(res.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
    }
  };

  const handleCallAI = async () => {
    if (!candidateToCall || !selectedCampaignId) return;
    setCalling(true);
    try {
      await api.post('/voice-agent/calls', {
        campaignId: selectedCampaignId,
        candidateId: candidateToCall.candidate.id,
        phoneNumber: callMethod === 'MOBILE' ? candidateToCall.candidate.phone : undefined,
        callMethod
      });
      alert(callMethod === 'BROWSER' ? 'Call initiated! An email link has been sent to the candidate.' : 'Call initiated successfully! The AI Agent is calling the candidate.');
      setIsAICallModalOpen(false);
      setCandidateToCall(null);
    } catch (error) {
      alert('Failed to initiate AI call. Make sure Exotel is configured and KYC is approved.');
    } finally {
      setCalling(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (jobForm.id) {
        await api.patch(`/recruitment/jobs/${jobForm.id}`, {
          ...jobForm,
          positions: Number(jobForm.positions),
          experienceMin: Number(jobForm.experienceMin),
          experienceMax: Number(jobForm.experienceMax),
        });
        setMessage('Job updated successfully!');
      } else {
        await api.post('/recruitment/jobs', {
          ...jobForm,
          organizationId,
          positions: Number(jobForm.positions),
          experienceMin: Number(jobForm.experienceMin),
          experienceMax: Number(jobForm.experienceMax),
        });
        setMessage('Job created successfully!');
      }
      setIsJobModalOpen(false);
      setJobForm({
        id: null,
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
      fetchData();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to save job.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setSaving(true);
    try {
      await api.delete(`/recruitment/jobs/${jobToDelete.id}`);
      setMessage('Job deleted successfully!');
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
      fetchData();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to delete job.');
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
      <div className="recruitment-stats-compact">
        <div className="stat-card-compact pink">
          <Briefcase size={16} className="stat-icon-compact pink" />
          <span className="stat-label-compact">Open Positions:</span>
          <span className="stat-value-compact">{openJobs}</span>
        </div>
        <div className="stat-card-compact brand">
          <Users size={16} className="stat-icon-compact brand" />
          <span className="stat-label-compact">Total Applicants:</span>
          <span className="stat-value-compact">{totalApps}</span>
        </div>
        <div className="stat-card-compact success">
          <CheckCircle2 size={16} className="stat-icon-compact success" />
          <span className="stat-label-compact">Hires This Cycle:</span>
          <span className="stat-value-compact">{hiredCount}</span>
        </div>
        <div className="stat-card-compact warning">
          <Calendar size={16} className="stat-icon-compact warning" />
          <span className="stat-label-compact">In Interview:</span>
          <span className="stat-value-compact">{inInterviewCount}</span>
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
          <div style={{ overflow: 'visible' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Job Title', 'Code', 'Type', 'Mode', 'Positions', 'Status', 'Deadline', ''].map((h, i) => (
                    <th key={i} style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : jobs.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No jobs found.</td></tr>
                ) : (
                  <>
                  {jobs.map((job, jobIdx) => {
                    const isLastRow = jobIdx >= jobs.length - 2;
                    return (
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
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.4rem', color: 'var(--text-secondary)', borderRadius: '4px' }}
                            onClick={(e) => { e.stopPropagation(); setActiveJobMenu(activeJobMenu === job.id ? null : job.id); }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {activeJobMenu === job.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                ...(isLastRow
                                  ? { bottom: '100%', marginBottom: '0.25rem' }
                                  : { top: '100%', marginTop: '0.25rem' }
                                ),
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                zIndex: 9999,
                                minWidth: '140px',
                                overflow: 'hidden'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }}
                                onClick={() => {
                                  setJobForm({
                                    id: job.id,
                                    title: job.title,
                                    employmentType: job.employmentType,
                                    workMode: job.workMode,
                                    positions: job.positions,
                                    experienceMin: job.experienceMin || 0,
                                    experienceMax: job.experienceMax || 0,
                                    publicDescription: job.publicDescription || '',
                                    applicationDeadline: job.applicationDeadline || '',
                                    status: job.status,
                                  });
                                  setIsJobModalOpen(true);
                                  setActiveJobMenu(null);
                                }}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: 'var(--danger)' }}
                                onClick={() => {
                                  setJobToDelete(job);
                                  setIsDeleteModalOpen(true);
                                  setActiveJobMenu(null);
                                }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline Tab - Table View */}
      {activeTab === 'pipeline' && (
        <div className="content-card">
          <div className="content-card-header">
            <span className="content-card-title">Candidate Pipeline</span>
            <span className="content-card-count">{applications.length} total</span>
          </div>
          <div className="content-card-body" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '150px' }}>Candidate Name</th>
                  <th style={{ minWidth: '200px' }}>Email ID</th>
                  <th style={{ minWidth: '180px' }}>Role</th>
                  {STAGES.map(stage => (
                    <th key={stage} style={{ minWidth: '100px', textAlign: 'center' }}>
                      {stage.charAt(0) + stage.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={3 + STAGES.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No candidates found.
                    </td>
                  </tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{app.candidate.firstName} {app.candidate.lastName}</span>
                          <button 
                            onClick={() => {
                              setCandidateToCall(app);
                              setIsAICallModalOpen(true);
                            }}
                            style={{
                              background: 'var(--brand-50)', border: 'none', cursor: 'pointer', color: 'var(--brand-600)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderRadius: '50%',
                              transition: 'all 0.2s'
                            }}
                            title="Call Candidate via AI Voice Agent"
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--brand-100)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'var(--brand-50)'}
                          >
                            <PhoneCall size={14} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {app.candidate.email}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 500 }}>
                        {app.job.title}
                      </td>
                      {STAGES.map(stage => {
                        let isYes = false;
                        if (app.stage === 'REJECTED') {
                          isYes = stage === 'REJECTED';
                        } else if (stage !== 'REJECTED') {
                          const appIdx = STAGES.indexOf(app.stage);
                          const colIdx = STAGES.indexOf(stage);
                          isYes = colIdx <= appIdx;
                        }

                        return (
                          <td key={stage} style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                            <select
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.8125rem',
                                background: isYes ? 'var(--brand-50)' : 'var(--bg-surface)',
                                color: isYes ? 'var(--brand-700)' : 'var(--text-secondary)',
                                fontWeight: isYes ? 600 : 400,
                                cursor: 'pointer'
                              }}
                              value={isYes ? 'Yes' : 'No'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'Yes') {
                                  updateApplicationStage(app.id, stage);
                                } else {
                                  // If they select 'No', we downgrade to the stage before this one
                                  const colIdx = STAGES.indexOf(stage);
                                  if (colIdx > 0 && stage !== 'REJECTED') {
                                    updateApplicationStage(app.id, STAGES[colIdx - 1]);
                                  } else if (stage === 'REJECTED') {
                                    // If un-rejecting, maybe fallback to APPLIED
                                    updateApplicationStage(app.id, 'APPLIED');
                                  }
                                }
                              }}
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post Job Full-Screen Page */}
      {isJobModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'inherit'
        }}>
          {/* Top Bar */}
          <div style={{
            padding: '0.875rem 2.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(244,114,182,0.06), rgba(99,102,241,0.06))',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#f472b6,#6366f1)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {jobForm.id ? 'Edit Job Opening' : 'Post New Job Opening'}
              </h2>
            </div>
            <button onClick={() => setIsJobModalOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: '1.5rem', transition: 'background 0.15s'
            }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--gray-100)')}
              onMouseOut={e => (e.currentTarget.style.background = 'none')}
            >&times;</button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2.5rem' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Job Title */}
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" required placeholder="e.g. Senior Frontend Engineer"
                    value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} />
                </div>

                {/* Row 1 */}
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

                {/* Row 2 */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">No. of Positions</label>
                    <input type="number" className="form-input" min={1} value={jobForm.positions}
                      onChange={e => setJobForm(p => ({ ...p, positions: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Application Deadline</label>
                    <input type="date" className="form-input" value={jobForm.applicationDeadline}
                      onChange={e => setJobForm(p => ({ ...p, applicationDeadline: e.target.value }))} />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min. Experience (yrs)</label>
                    <input type="number" className="form-input" min={0} value={jobForm.experienceMin}
                      onChange={e => setJobForm(p => ({ ...p, experienceMin: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max. Experience (yrs)</label>
                    <input type="number" className="form-input" min={0} value={jobForm.experienceMax}
                      onChange={e => setJobForm(p => ({ ...p, experienceMax: Number(e.target.value) }))} />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Job Description (Public)</label>
                  <textarea className="form-textarea" rows={5}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    value={jobForm.publicDescription}
                    onChange={e => setJobForm(p => ({ ...p, publicDescription: e.target.value }))} />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label">Publish Status</label>
                  <select className="form-select" value={jobForm.status} onChange={e => setJobForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="PUBLISHED">Publish Now</option>
                    <option value="DRAFT">Save as Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 2.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
              background: 'var(--gray-50)', flexShrink: 0
            }}>
              <button type="button" className="btn-secondary-modal" onClick={() => setIsJobModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-post-job" style={{ borderRadius: 'var(--radius-md)', padding: '0.625rem 1.5rem' }} disabled={saving}>
                {saving ? 'Saving...' : jobForm.id ? 'Update Job' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', height: 'auto', maxHeight: '90vh', borderRadius: '1.25rem' }}>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && jobToDelete && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', height: 'auto', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Delete Job Opening</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                Are you really want to delete this job opening? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ padding: '0.5rem 1.5rem', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
              >
                No, cancel
              </button>
              <button 
                onClick={handleDeleteJob}
                disabled={saving}
                style={{ padding: '0.5rem 1.5rem', border: 'none', background: 'var(--danger)', color: '#fff', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
              >
                {saving ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Call Modal */}
      {isAICallModalOpen && candidateToCall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: '1rem', width: '100%', maxWidth: '400px',
            boxShadow: 'var(--shadow-xl)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PhoneCall size={20} className="text-brand-500" /> Call {candidateToCall.candidate.firstName}
              </h3>
              <button onClick={() => setIsAICallModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {campaigns.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No AI Voice Campaigns found. Please create one in the Voice Agent dashboard first.
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Select Voice Campaign</label>
                    <select 
                      className="form-select" 
                      value={selectedCampaignId} 
                      onChange={e => setSelectedCampaignId(e.target.value)}
                    >
                      {campaigns.map(camp => (
                        <option key={camp.id} value={camp.id}>{camp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Call Method</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexDirection: 'column' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="callMethod" checked={callMethod === 'BROWSER'} onChange={() => setCallMethod('BROWSER')} style={{ width: '16px', height: '16px' }} />
                        Call via Browser (Sends Email Link)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="callMethod" checked={callMethod === 'MOBILE'} onChange={() => setCallMethod('MOBILE')} style={{ width: '16px', height: '16px' }} />
                        Call on Mobile (Exotel Voice)
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--gray-50)' }}>
              <button 
                type="button" 
                onClick={() => setIsAICallModalOpen(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleCallAI}
                disabled={calling || campaigns.length === 0}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #f472b6, #6366f1)', color: '#fff', cursor: calling ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: calling || campaigns.length === 0 ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {calling ? 'Initiating Call...' : 'Call Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
