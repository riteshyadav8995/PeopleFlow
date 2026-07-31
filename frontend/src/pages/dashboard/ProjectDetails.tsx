import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Activity, LayoutTemplate, MessageSquare, GripHorizontal, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AddProjectMemberModal } from './components/project/AddProjectMemberModal';
import { EditTaskModal } from './components/project/EditTaskModal';
import { api } from '@/lib/api';
import './ProjectDetails.css';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedHours: number | null;
  assignee?: { id: string; user?: { firstName: string; lastName: string } };
}

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  manager?: { user?: { firstName: string; lastName: string } };
}

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
    } catch (error) {
      console.error('Error fetching project', error);
    }
  };

  const handleAddMember = async (data: any) => {
    try {
      setIsSubmittingMember(true);
      await api.post(`/projects/${id}/members`, data);
      setIsAddMemberModalOpen(false);
      alert('Member added successfully!');
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Failed to add member', error.response?.data || error);
      alert(`Failed to add member: ${error.response?.data?.message || 'Check console.'}`);
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks?projectId=${id}`);
      setTasks(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async () => {
    try {
      const title = prompt('Task Title:');
      if (!title) return;

      await api.post('/tasks', {
        projectId: id,
        title,
        status: 'BACKLOG',
        priority: 'MEDIUM'
      });
      fetchTasks();
    } catch (error: any) {
      console.error('Failed to create task', error.response?.data || error);
      alert(`Failed to create task: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!selectedTask) return;
    try {
      setIsUpdatingTask(true);
      await api.put(`/tasks/${selectedTask.id}`, data);
      setIsEditTaskModalOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error: any) {
      console.error('Failed to update task', error.response?.data || error);
      alert(`Failed to update task: ${error.response?.data?.message || 'Check console.'}`);
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      await api.post(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status', error);
      fetchTasks(); // Revert on failure
    }
  };

  if (isLoading) return <div className="p-8 text-secondary flex items-center justify-center gap-3"><Activity className="animate-spin text-brand-500" /> Loading Kanban Board...</div>;
  if (!project) return <div className="p-8 text-danger">Project not found</div>;

  const columns = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  return (
    <div className="project-details-container">
      
      {/* Premium Header */}
      <div className="project-header-card">
        <div className="project-header-left">
          <button onClick={() => navigate('/projects')} className="project-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="project-icon-wrapper">
               <LayoutTemplate size={24} />
            </div>
            <div>
              <h1 className="project-title">{project.name}</h1>
              <p className="project-meta">
                <span className={`project-status-badge ${project.status === 'ACTIVE' ? 'active' : 'neutral'}`}>
                  {project.status}
                </span>
                {project.code}
              </p>
            </div>
          </div>
        </div>
        <div className="project-header-actions">
          <Button variant="secondary" leftIcon={<Users size={18} />} onClick={() => setIsAddMemberModalOpen(true)} style={{ borderRadius: '2rem' }}>
            Add Member
          </Button>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={createTask} style={{ borderRadius: '2rem' }}>
            New Task
          </Button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="kanban-board">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col);
          return (
          <div key={col} className="kanban-column">
            
            {/* Column Header */}
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                <div className="kanban-column-dot" style={{ background: col === 'DONE' ? 'var(--success)' : col === 'IN_PROGRESS' ? 'var(--warning)' : 'var(--brand-500)' }}></div>
                {col.replace('_', ' ')}
              </div>
              <span className="kanban-column-count">
                {colTasks.length}
              </span>
            </div>
            
            {/* Task List */}
            <div className="kanban-column-body">
              {colTasks.map(task => (
                <div 
                  key={task.id} 
                  className="kanban-task" 
                  onClick={() => { setSelectedTask(task); setIsEditTaskModalOpen(true); }} 
                  style={{ cursor: 'pointer' }}
                >
                  <div className="kanban-task-header">
                    <span className={`kanban-task-priority ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <GripHorizontal size={14} className="kanban-task-grip" />
                  </div>
                  
                  <h4 className="kanban-task-title">{task.title}</h4>
                  
                  <div className="kanban-task-footer">
                    {task.assignee ? (
                      <div className="kanban-task-assignee">
                        <div className="kanban-task-avatar">
                          {task.assignee.user?.firstName[0]}{task.assignee.user?.lastName[0]}
                        </div>
                      </div>
                    ) : (
                      <div className="kanban-task-unassigned">Unassigned</div>
                    )}
                    
                    <div className="kanban-task-actions">
                      {col !== 'BACKLOG' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, columns[columns.indexOf(col) - 1]); }} className="kanban-task-move-btn">
                          ←
                        </button>
                      )}
                      {col !== 'DONE' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, columns[columns.indexOf(col) + 1]); }} className="kanban-task-move-btn">
                          →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {colTasks.length === 0 && (
                <div className="kanban-empty">
                  No tasks here.
                </div>
              )}
            </div>
          </div>
        )})}
      </div>
      
      {isAddMemberModalOpen && (
        <AddProjectMemberModal 
          onClose={() => setIsAddMemberModalOpen(false)}
          onSubmit={handleAddMember}
          isSubmitting={isSubmittingMember}
        />
      )}

      {isEditTaskModalOpen && (
        <EditTaskModal 
          isOpen={isEditTaskModalOpen}
          onClose={() => setIsEditTaskModalOpen(false)}
          onSubmit={handleUpdateTask}
          task={selectedTask}
          projectMembers={(project as any)?.members || []}
          isSubmitting={isUpdatingTask}
        />
      )}
    </div>
  );
}
