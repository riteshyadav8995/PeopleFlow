import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanSquare, Plus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import './TeamTasks.css';

export function TeamTasks() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const managerId = user?.employeeId;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    dueDate: ''
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['teamTasks', managerId],
    queryFn: async () => {
      const res = await api.get('/task', { params: { managerId } });
      return res.data.data;
    },
    enabled: !!managerId
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['teamMembers', managerId],
    queryFn: async () => {
      const res = await api.get('/employee', { params: { managerId } });
      return res.data.data;
    },
    enabled: !!managerId
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await api.post(`/task/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await api.post('/task', taskData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        projectId: '',
        assigneeId: '',
        priority: 'MEDIUM',
        dueDate: ''
      });
    }
  });

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.projectId || !newTask.assigneeId) {
      alert('Title, Project, and Assignee are required');
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const columns = [
    { id: 'BACKLOG', title: 'To Do', iconClass: 'todo', icon: <AlertCircle size={20} /> },
    { id: 'IN_PROGRESS', title: 'In Progress', iconClass: 'progress', icon: <Clock size={20} /> },
    { id: 'COMPLETED', title: 'Done', iconClass: 'done', icon: <CheckCircle2 size={20} /> }
  ];

  return (
    <div className="team-tasks-container page-container">
      <div className="tasks-header">
        <div className="tasks-title-wrapper">
          <h1 className="tasks-title">
            <KanbanSquare className="tasks-title-icon" size={24} />
            Team Tasks
          </h1>
          <p className="tasks-subtitle">Manage and track tasks assigned to your direct reports.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Create Task
        </button>
      </div>

      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map(col => {
            const columnTasks = tasks?.filter((t: any) => t.status === col.id) || [];
            
            return (
              <div key={col.id} className="kanban-column">
                <div className="column-header">
                  <div className="column-title-wrapper">
                    <span className={`column-icon ${col.iconClass}`}>{col.icon}</span>
                    <h3 className="column-title">{col.title}</h3>
                  </div>
                  <span className="column-count">
                    {columnTasks.length}
                  </span>
                </div>
                
                <div className="column-body">
                  {columnTasks.map((task: any) => (
                    <div key={task.id} className="task-card">
                      <div className="task-header">
                        <span className={`priority-badge ${
                          task.priority === 'HIGH' ? 'high' :
                          task.priority === 'MEDIUM' ? 'medium' :
                          'low'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="task-title">{task.title}</h4>
                      <p className="task-desc">{task.description}</p>
                      
                      <div className="task-footer">
                        <div className="assignee-wrapper">
                          <div className="assignee-avatar" title={`${task.assignee?.firstName} ${task.assignee?.lastName}`}>
                            {task.assignee?.firstName?.charAt(0)}{task.assignee?.lastName?.charAt(0)}
                          </div>
                          <span className="assignee-name">
                            {task.assignee?.firstName}
                          </span>
                        </div>
                        
                        {/* Status Actions Dropdown simulation */}
                        <select 
                          className="status-select"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <option value="BACKLOG">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Done</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="empty-column">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="team-task-modal" style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">Create New Task</h2>
            <p className="modal-subtitle">Assign a task to a team member.</p>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title *</label>
              <input 
                type="text" 
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}
                placeholder="Enter task title"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
              <textarea 
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem', minHeight: '80px' }}
                placeholder="Enter task description"
              />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Project *</label>
                <select 
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}
                >
                  <option value="">Select Project</option>
                  {projects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Assignee *</label>
                <select 
                  value={newTask.assigneeId}
                  onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}
                >
                  <option value="">Select Team Member</option>
                  {teamMembers?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Priority</label>
                <select 
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Due Date</label>
                <input 
                  type="date" 
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn-cancel"
                disabled={createTaskMutation.isPending}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
