import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import './Layout.css';

export default function PublicLayout() {
  const token = localStorage.getItem('candidateToken');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('candidateToken');
    navigate('/candidate/login');
  };

  return (
    <div className="layout-container" style={{ display: 'block', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Public Header */}
      <header className="top-header" style={{ padding: '1rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.5rem', color: '#1e293b' }}>
          <Briefcase size={28} color="#4f46e5" />
          <span>PeopleFlow Careers</span>
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/jobs" style={{ color: '#475569', fontWeight: 500, textDecoration: 'none' }}>All Jobs</Link>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {token ? (
            <>
              <Link to="/candidate/dashboard" style={{ textDecoration: 'none', color: '#475569', fontWeight: 600 }}>Dashboard</Link>
              <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/candidate/login" style={{ textDecoration: 'none', color: '#475569', fontWeight: 600 }}>Log in</Link>
              <Link to="/candidate/login?mode=signup" style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>Sign up</Link>
            </>
          )}
        </div>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: '3rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: '#1e293b', color: '#cbd5e1', padding: '3rem 5%', textAlign: 'center', marginTop: 'auto' }}>
        <p>&copy; {new Date().getFullYear()} PeopleFlow. All rights reserved.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Empowering teams, simplifying HR.</p>
      </footer>
    </div>
  );
}
