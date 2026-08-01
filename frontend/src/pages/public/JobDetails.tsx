import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, ChevronLeft, Building2 } from 'lucide-react';
import axios from 'axios';
import { PUBLIC_API_URL } from '@/lib/api';

interface PublicJob {
  id: string;
  title: string;
  employmentType: string;
  workMode: string;
  experienceMin: number;
  experienceMax: number;
  publicDescription: string;
  applicationDeadline?: string;
  createdAt: string;
  tenant: { name: string };
}

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyMode, setApplyMode] = useState(false);

  // Application State
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchJob();
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('apply') === 'true' && localStorage.getItem('candidateToken')) {
      setApplyMode(true);
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`${PUBLIC_API_URL}/jobs/${id}`);
      setJob(res.data.data);
    } catch (error) {
      console.error('Failed to fetch job', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    const token = localStorage.getItem('candidateToken');
    if (!token) {
      window.location.href = `/candidate/login?redirect=${encodeURIComponent(`/jobs/${id}?apply=true`)}`;
    } else {
      setApplyMode(true);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('candidateToken');
      if (!token) return;
      
      const candidateId = JSON.parse(atob(token.split('.')[1])).id; // Quick decode

      await axios.post(`${PUBLIC_API_URL}/jobs/${id}/apply`, {
        candidateId,
        resumeUrl,
        coverLetter
      });
      setApplied(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading job details...</div>;
  if (!job) return <div style={{ padding: '3rem', textAlign: 'center' }}>Job not found.</div>;

  const isExpired = job.applicationDeadline && new Date(job.applicationDeadline).setHours(23, 59, 59, 999) < new Date().getTime();

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '3rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <Link to="/jobs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '2rem', fontWeight: 500 }}>
        <ChevronLeft size={20} /> Back to all jobs
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {job.title}
            {isExpired && <span style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid #fecaca' }}>Expired</span>}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#475569', fontSize: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={18} /> {job.tenant?.name || 'Company'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={18} /> {job.employmentType.replace('_', ' ')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={18} /> {job.workMode}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} /> {job.experienceMax > 0 ? `${job.experienceMin}-${job.experienceMax} Yrs` : 'Entry Level'}</span>
          </div>
        </div>
        <div>
          {!applyMode && !applied && !isExpired && (
            <button onClick={handleApplyClick} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '1rem 2rem', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}>
              Apply for this role
            </button>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '3rem 0' }} />

      {!applyMode && !applied ? (
        <div style={{ color: '#334155', lineHeight: 1.8, fontSize: '1.125rem', whiteSpace: 'pre-wrap' }}>
          {job.publicDescription || 'No description provided.'}
        </div>
      ) : applied ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#ecfdf5', borderRadius: '0.75rem', border: '1px solid #a7f3d0' }}>
          <h2 style={{ color: '#059669', marginBottom: '1rem' }}>Application Submitted!</h2>
          <p style={{ color: '#047857' }}>Thank you for applying. Our team will review your application and get back to you soon.</p>
          <button onClick={() => window.location.href = '/jobs'} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#fff', border: '1px solid #059669', color: '#059669', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600 }}>Back to Jobs</button>
        </div>
      ) : isExpired ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Job Expired</h2>
          <p style={{ color: '#991b1b' }}>The application deadline for this position has passed.</p>
          <button onClick={() => window.location.href = '/jobs'} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600 }}>Back to Jobs</button>
        </div>
      ) : (
        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>Submit your application</h2>
          <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Resume URL *</label>
              <input 
                type="url" 
                required 
                placeholder="https://linkedin.com/in/yourprofile or Google Drive link"
                value={resumeUrl}
                onChange={e => setResumeUrl(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Cover Letter / Notes (Optional)</label>
              <textarea 
                rows={5}
                placeholder="Tell us why you are a great fit for this role..."
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', resize: 'vertical' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={() => setApplyMode(false)} style={{ padding: '0.75rem 1.5rem', background: '#fff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', border: 'none', color: '#fff', borderRadius: '0.375rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
