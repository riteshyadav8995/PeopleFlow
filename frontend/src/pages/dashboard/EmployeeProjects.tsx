import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Briefcase, Users, CheckSquare, ArrowRight, FolderOpen } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import './EmployeeProjects.css';

export function EmployeeProjects() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const orgId = user?.organizationId || user?.tenantId || '';

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['myProjects', orgId],
    queryFn: async () => {
      const res = await api.get('/projects', { params: { organizationId: orgId } });
      return res.data.data || [];
    },
    enabled: !!orgId
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'ep-status-active';
      case 'COMPLETED': return 'ep-status-completed';
      case 'ON_HOLD': return 'ep-status-hold';
      case 'DRAFT': return 'ep-status-draft';
      default: return 'ep-status-draft';
    }
  };

  return (
    <div className="ep-container page-container">
      <div className="ep-header">
        <div>
          <h1 className="ep-title">
            <Briefcase className="ep-title-icon" size={24} />
            My Projects
          </h1>
          <p className="ep-subtitle">View all projects you're assigned to or managing.</p>
        </div>
        <div className="ep-stats-row">
          <div className="ep-stat-chip">
            <FolderOpen size={16} />
            <span>{projects?.length || 0} Projects</span>
          </div>
          <div className="ep-stat-chip ep-stat-active">
            <CheckSquare size={16} />
            <span>{projects?.filter((p: any) => p.status === 'ACTIVE').length || 0} Active</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="ep-loading"><Spinner /></div>
      ) : error ? (
        <div className="ep-empty">
          <FolderOpen size={48} strokeWidth={1} />
          <h3>Unable to load projects</h3>
          <p>Please try refreshing the page.</p>
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="ep-empty">
          <FolderOpen size={48} strokeWidth={1} />
          <h3>No projects found</h3>
          <p>You haven't been assigned to any projects yet.</p>
        </div>
      ) : (
        <div className="ep-grid">
          {projects.map((project: any) => (
            <div
              key={project.id}
              className="ep-card"
              onClick={() => navigate(`/employee/work/projects/${project.id}`)}
            >
              <div className="ep-card-top">
                <div className="ep-card-title-row">
                  <h3 className="ep-card-name">{project.name}</h3>
                  <span className={`ep-status-badge ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <p className="ep-card-code">{project.code}</p>
                {project.description && (
                  <p className="ep-card-desc">{project.description}</p>
                )}
              </div>
              <div className="ep-card-bottom">
                <div className="ep-card-meta">
                  <div className="ep-meta-item">
                    <Users size={14} />
                    <span>{project._count?.members || 0} Members</span>
                  </div>
                  <div className="ep-meta-item">
                    <CheckSquare size={14} />
                    <span>{project._count?.tasks || 0} Tasks</span>
                  </div>
                </div>
                {project.manager && (
                  <div className="ep-card-manager">
                    Manager: {project.manager.firstName} {project.manager.lastName}
                  </div>
                )}
                <div className="ep-card-arrow">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
