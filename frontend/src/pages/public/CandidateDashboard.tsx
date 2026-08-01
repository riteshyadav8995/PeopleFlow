import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PUBLIC_API_URL } from '@/lib/api';
import { format } from 'date-fns';
import { Briefcase, Building2, Calendar, FileText } from 'lucide-react';

interface Application {
  id: string;
  stage: string;
  appliedAt: string;
  resumeUrl: string;
  coverLetter: string;
  job: {
    title: string;
    employmentType: string;
    workMode: string;
    tenant: {
      name: string;
    };
  };
}

export default function CandidateDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('candidateToken');
      if (!token) {
        window.location.href = '/candidate/login';
        return;
      }
      const res = await axios.get(`${PUBLIC_API_URL}/candidate/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
      // Auto logout if token invalid
      localStorage.removeItem('candidateToken');
      window.location.href = '/candidate/login';
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage.toUpperCase()) {
      case 'APPLIED': return { bg: '#e0e7ff', text: '#4338ca' }; // indigo
      case 'SCREENING': return { bg: '#fef08a', text: '#854d0e' }; // yellow
      case 'INTERVIEW': return { bg: '#dbeafe', text: '#1d4ed8' }; // blue
      case 'OFFER': return { bg: '#bbf7d0', text: '#166534' }; // green
      case 'HIRED': return { bg: '#22c55e', text: '#ffffff' }; // vibrant green
      case 'REJECTED': return { bg: '#fecaca', text: '#b91c1c' }; // red
      default: return { bg: '#f1f5f9', text: '#475569' }; // gray
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Your Applications</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Track the status of your job applications across all companies.</p>

      {applications.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '4rem 2rem', textAlign: 'center' }}>
          <Briefcase size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155' }}>No applications yet</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>You haven't applied for any jobs yet. Start exploring opportunities!</p>
          <a href="/jobs" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>Explore Jobs</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map(app => {
            const colors = getStageColor(app.stage);
            return (
              <div key={app.id} style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                
                <div style={{ flex: '1 1 min-content' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{app.job.title}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Building2 size={16} /> {app.job.tenant?.name || 'Company'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={16} /> Applied on {format(new Date(app.appliedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {app.resumeUrl && (
                    <a href={app.resumeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
                      <FileText size={16} /> View Resume
                    </a>
                  )}
                  <span style={{ background: colors.bg, color: colors.text, padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {app.stage.toUpperCase()}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
