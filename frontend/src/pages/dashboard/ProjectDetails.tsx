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
  
  const [editingAssigneeId, setEditingAssigneeId] = useState<string | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');

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

  const updateTaskPriority = async (taskId: string, priority: string) => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, priority } : t));
      await api.put(`/tasks/${taskId}`, { priority });
    } catch (error) {
      console.error('Failed to update priority', error);
      fetchTasks();
    }
  };

  const updateTaskAssignee = async (taskId: string, assigneeId: string) => {
    try {
      const member = (project as any)?.members?.find((m: any) => m.employeeId === assigneeId);
      setTasks(tasks.map(t => t.id === taskId ? { 
        ...t, 
        assignee: member ? { id: member.employeeId, user: member.employee } : undefined 
      } : t));
      
      await api.put(`/tasks/${taskId}`, { assigneeId: assigneeId || null });
    } catch (error) {
      console.error('Failed to update assignee', error);
      fetchTasks();
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

      {/* Task Pipeline Table */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#cbd5e1', color: '#475569', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>TASK NAME</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>ASSIGNEE</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>PRIORITY</th>
              {columns.map(col => (
                <th key={col} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>{col.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a', minWidth: '200px' }}>
                  <span onClick={() => { setSelectedTask(task); setIsEditTaskModalOpen(true); }} style={{ cursor: 'pointer' }}>
                    {task.title}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.875rem', minWidth: '200px' }}>
                  {editingAssigneeId === task.id ? (
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Search employee..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        onBlur={() => setTimeout(() => setEditingAssigneeId(null), 200)}
                        style={{ padding: '0.375rem 0.75rem', border: '1px solid var(--brand-500)', borderRadius: '4px', outline: 'none', width: '100%', fontSize: '0.875rem' }}
                      />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', zIndex: 10, maxHeight: '150px', overflowY: 'auto', borderRadius: '4px', marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div 
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}
                          onClick={() => { updateTaskAssignee(task.id, ''); setEditingAssigneeId(null); }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Unassigned
                        </div>
                        {((project as any)?.members || []).filter((m: any) => 
                           `${m.employee?.firstName} ${m.employee?.lastName}`.toLowerCase().includes(assigneeSearch.toLowerCase())
                        ).map((m: any) => (
                          <div 
                            key={m.employeeId} 
                            style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}
                            onClick={() => { updateTaskAssignee(task.id, m.employeeId); setEditingAssigneeId(null); }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            {m.employee?.firstName} {m.employee?.lastName}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { setEditingAssigneeId(task.id); setAssigneeSearch(''); }}
                      style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.2s', padding: '0.375rem 0' }}
                      onMouseOver={e => e.currentTarget.style.textDecorationColor = '#3b82f6'}
                      onMouseOut={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                    >
                      {task.assignee?.user?.firstName ? `${task.assignee.user.firstName} ${task.assignee.user.lastName}` : 'Unassigned'}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem', minWidth: '100px' }}>
                  <select
                    style={{
                      padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0',
                      background: '#fff', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer'
                    }}
                    value={task.priority}
                    onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </td>
                {columns.map(col => {
                  const isCurrentStage = task.status === col;
                  const isPassedStage = columns.indexOf(task.status) > columns.indexOf(col);
                  const isYes = isCurrentStage || isPassedStage;
                  
                  return (
                    <td key={col} style={{ padding: '1rem', minWidth: '120px' }}>
                      <select 
                        style={{
                          padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0',
                          background: isYes ? '#eff6ff' : '#fff',
                          color: isYes ? '#3b82f6' : '#64748b',
                          fontSize: '0.875rem', cursor: 'pointer', outline: 'none'
                        }}
                        value={isYes ? 'Yes' : 'No'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Yes') {
                            updateTaskStatus(task.id, col);
                          } else {
                            const colIdx = columns.indexOf(col);
                            if (colIdx > 0) {
                              updateTaskStatus(task.id, columns[colIdx - 1]);
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
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={3 + columns.length} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No tasks found. Create a new task to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
