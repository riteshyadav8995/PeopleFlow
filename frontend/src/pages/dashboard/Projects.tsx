import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutTemplate, Briefcase, Users, Activity, CheckCircle2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.project-menu-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveDropdown(null);
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete project', err);
      alert('Failed to delete project');
    }
  };

  const handleEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setActiveDropdown(null);
    setEditingProject(project);
    setIsCreateModalOpen(true);
  };

  const handleSaveProject = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, data);
      } else {
        await api.post('/projects', data);
      }
      setIsCreateModalOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Failed to save project', error);
      alert('Failed to save project (check console)');
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
      <div className="projects-stats-row">
        <div className="proj-stat-card p-brand">
          <div className="proj-stat-icon-box"><LayoutTemplate size={16} /></div>
          <p className="proj-stat-label">Active Projects:</p>
          <span className="proj-stat-value">{projects.length}</span>
        </div>
        <div className="proj-stat-card p-warning">
          <div className="proj-stat-icon-box"><Briefcase size={16} /></div>
          <p className="proj-stat-label">Open Tasks:</p>
          <span className="proj-stat-value">{totalTasks}</span>
        </div>
        <div className="proj-stat-card p-success">
          <div className="proj-stat-icon-box"><Users size={16} /></div>
          <p className="proj-stat-label">Team Members:</p>
          <span className="proj-stat-value">{totalMembers}</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
                <h3 className="project-name">{project.name}</h3>
                <span className={`status-badge ${project.status.toLowerCase()}`}>{project.status}</span>
              </div>
              
              <div className="project-menu-container">
                <button 
                  className="btn-icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === project.id ? null : project.id);
                  }}
                >
                  <MoreVertical size={18} />
                </button>
                {activeDropdown === project.id && (
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={(e) => handleEdit(e, project)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button className="dropdown-item danger" onClick={(e) => handleDelete(e, project.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: '-0.25rem' }}>
              <span className="project-code-badge">Proj ID: {project.code}</span>
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
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingProject(null);
          }}
          onSubmit={handleSaveProject}
          isSubmitting={isSubmitting}
          initialData={editingProject}
        />
      )}
    </div>
  );
}
