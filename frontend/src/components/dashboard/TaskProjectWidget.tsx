import React from 'react';
import { CheckSquare, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TaskProjectWidget({ stats }: { stats: { pendingTasks: number, activeProjects: number } }) {
  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      <Link 
        to="/employee/work/tasks"
        className="card"
        style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          textAlign: 'center', transition: 'all 0.2s', textDecoration: 'none', cursor: 'pointer' 
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
      >
        <div style={{ 
          padding: '1rem', background: 'var(--brand-50)', color: 'var(--brand-600)', 
          borderRadius: '12px', marginBottom: '1rem' 
        }}>
          <CheckSquare size={28} />
        </div>
        <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--gray-900)', lineHeight: 1 }}>
          {stats?.pendingTasks || 0}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
          Pending Tasks
        </span>
      </Link>
      
      <Link 
        to="/employee/work/projects"
        className="card"
        style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          textAlign: 'center', transition: 'all 0.2s', textDecoration: 'none', cursor: 'pointer' 
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
      >
        <div style={{ 
          padding: '1rem', background: '#fdf4ff', color: '#c026d3', // fuchsia-50 and fuchsia-600 equivalents
          borderRadius: '12px', marginBottom: '1rem' 
        }}>
          <Briefcase size={28} />
        </div>
        <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--gray-900)', lineHeight: 1 }}>
          {stats?.activeProjects || 0}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
          Active Projects
        </span>
      </Link>
    </div>
  );
}
