import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Briefcase } from 'lucide-react';
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
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${PUBLIC_API_URL}/jobs`);
      setJobs(res.data.data);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Find Your Next Dream Job</h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Join a team of passionate individuals working to build the future of workforce management.</p>
        
        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0.75rem 1.5rem', borderRadius: '9999px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '600px' }}>
            <Search color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search by job title, role, or keywords..." 
              style={{ border: 'none', outline: 'none', padding: '0.5rem 1rem', width: '100%', fontSize: '1.125rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.75rem 2rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>Search</button>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Open Positions ({filteredJobs.length})</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading open positions...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', fontSize: '1.125rem' }}>No open positions found matching "{search}".</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredJobs.map(job => {
              const isExpired = job.applicationDeadline && new Date(job.applicationDeadline).setHours(23, 59, 59, 999) < new Date().getTime();
              return (
              <div key={job.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', opacity: isExpired ? 0.75 : 1 }} className="job-card" onClick={() => window.location.href = `/jobs/${job.id}`}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {job.title}
                    {isExpired && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '9999px', border: '1px solid #fecaca' }}>Expired</span>}
                  </h3>
                  <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Briefcase size={16} /> {job.employmentType.replace('_', ' ')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><MapPin size={16} /> {job.workMode}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={16} /> {job.experienceMax > 0 ? `${job.experienceMin}-${job.experienceMax} Yrs` : 'Fresher / Entry Level'}</span>
                  </div>
                </div>
                <div>
                  <Link to={`/jobs/${job.id}`} style={{ padding: '0.625rem 1.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>View Role</Link>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
