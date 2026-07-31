import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutTemplate, Briefcase, Users, Activity, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { CreateProjectModal } from './components/project/CreateProjectModal';
import './Projects.css';

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  type: string;
  visibility: string;
  createdAt: string;
  _count?: {
    tasks: number;
    members: number;
  };
}

export function Projects() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [user?.organizationId]);

  const fetchProjects = async () => {
    try {
      const orgIdParam = user?.organizationId ? `?organizationId=${user.organizationId}` : '';
      const res = await api.get(`/projects${orgIdParam}`);
      setProjects(res.data.data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (data: any) => {
    try {
      setIsSubmitting(true);
      await api.post('/projects', data);
      setIsCreateModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project', error);
      alert('Failed to create project (check console)');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="loading-state">
      <Activity className="projects-title-icon" size={24} style={{ animation: 'spin 1s linear infinite' }} />
      Loading projects...
    </div>
  );

  const totalTasks = projects.reduce((acc, p) => acc + (p._count?.tasks || 0), 0);
  const totalMembers = projects.reduce((acc, p) => acc + (p._count?.members || 0), 0);

  return (
    <div className="projects-container page-container">
      {/* Hero */}
      <div className="projects-hero">
        <div>
          <h1 className="projects-title">
            <span className="projects-title-icon"><LayoutTemplate size={32} /></span>
            Projects & Teams
          </h1>
          <p className="projects-subtitle">
            Manage organizational initiatives, assign resources, and track milestone completions in real-time.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="projects-stats">
        <div className="stat-card brand">
          <div className="stat-icon brand"><LayoutTemplate size={28} /></div>
          <div>
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning"><Briefcase size={28} /></div>
          <div>
            <div className="stat-value">{totalTasks}</div>
            <div className="stat-label">Open Tasks</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon success"><Users size={28} /></div>
          <div>
            <div className="stat-value">{totalMembers}</div>
            <div className="stat-label">Team Members</div>
          </div>
        </div>
      </div>

      <div className="projects-grid">
        {projects.map(project => (
          <div 
            key={project.id} 
            className="project-card" 
            onClick={() => navigate(`/organization/projects/${project.id}`)}
          >
            <div className="project-card-header">
              <h3 className="project-name">{project.name}</h3>
              <span className={`status-badge ${project.status.toLowerCase()}`}>{project.status}</span>
            </div>
            <div className="project-code">{project.code}</div>
            <div className="project-meta">
              <span>Type: {project.type}</span>
              <span>Vis: {project.visibility}</span>
            </div>
            <div className="project-metrics">
              <div className="metric">
                <Briefcase size={14} />
                <span>{project._count?.tasks || 0} tasks</span>
              </div>
              <div className="metric">
                <Users size={14} />
                <span>{project._count?.members || 0} members</span>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><LayoutTemplate size={48} /></div>
            <h3 className="empty-state-title">No Projects Found</h3>
            <p className="empty-state-desc">Create a project to start collaborating with your team and assigning tasks.</p>
            <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} /> Create First Project
            </button>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateProjectModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
