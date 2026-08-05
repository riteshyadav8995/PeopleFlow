import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, CheckCircle2, Clock, PlayCircle, X, Inbox } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import './MyTasks.css';

export function MyTasks() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [newTask, setNewTask] = useState({
    title: '',
    projectId: '',
    priority: 'Medium',
    due: ''
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['employeeTasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data.data;
    }
  });

  const { data: projectsData } = useQuery({
    queryKey: ['employeeProjects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data;
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return await api.post('/tasks', taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeTasks'] });
      setIsModalOpen(false);
      setNewTask({ title: '', projectId: '', priority: 'Medium', due: '' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.projectId) return;

    createTaskMutation.mutate({
      title: newTask.title,
      projectId: newTask.projectId,
      priority: newTask.priority,
      status: 'To Do',
      dueDate: newTask.due ? new Date(newTask.due).toISOString() : null
    });
  };

  const tasks = tasksData || [];
  const columns = ['To Do', 'In Progress', 'In Review', 'Done'];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'var(--danger-500)';
      case 'High': return '#ea580c';
      case 'Medium': return 'var(--warning-600)';
      case 'Low': return 'var(--success-500)';
      default: return 'var(--gray-500)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'To Do': return <Clock size={16} color="var(--gray-500)" />;
      case 'In Progress': return <PlayCircle size={16} color="var(--brand-500)" />;
      case 'In Review': return <MoreHorizontal size={16} color="var(--warning-500)" />;
      case 'Done': return <CheckCircle2 size={16} color="var(--success-500)" />;
      default: return null;
    }
  };

  const filteredTasks = tasks.filter((t: any) => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="tasks-container">
      {/* Header */}
      <div className="tasks-header">
        <div>
          <h1 className="tasks-title">My Tasks</h1>
          <p className="tasks-subtitle">Manage your daily work and track progress.</p>
        </div>
        <div className="tasks-actions">
          <div className="view-toggle">
            <button 
              onClick={() => setView('board')}
              className={`view-btn ${view === 'board' ? 'active' : ''}`}
            >
              Board
            </button>
            <button 
              onClick={() => setView('list')}
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
            >
              List
            </button>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tasks-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn-secondary">
          <Filter size={18} /> Filter
        </button>
      </div>

      {/* Content Area */}
      <div className="tasks-content">
        {view === 'board' ? (
          <div className="board-container">
            {columns.map(column => {
              const colTasks = filteredTasks.filter((t: any) => t.status === column);
              return (
                <div key={column} className="board-column">
                  <div className={`column-header ${column.replace(' ', '-').toLowerCase()}`}>
                    <div className="column-title-group">
                      {getStatusIcon(column)}
                      <h3 className="column-title">{column}</h3>
                    </div>
                    <span className="column-badge">{colTasks.length}</span>
                  </div>
                  
                  <div className="column-tasks">
                    {colTasks.map((task: any) => (
                      <div key={task.id} className="task-card" style={{ borderLeft: `3px solid ${getPriorityColor(task.priority)}` }}>
                        <div className="task-card-header">
                          <span className="priority-label" style={{ color: getPriorityColor(task.priority) }}>
                            {task.priority}
                          </span>
                          <button className="more-btn"><MoreHorizontal size={16} /></button>
                        </div>
                        <h4 className="task-title">{task.title}</h4>
                        <div className="task-project">
                          Project ID: {task.projectId}
                        </div>
                        {task.dueDate && (
                          <div className="task-footer">
                            <Clock size={14} />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="empty-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.7 }}>
                        <Inbox size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                        <span>No tasks in {column}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="list-container">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task: any) => (
                  <tr key={task.id}>
                    <td className="list-task-title">{task.title}</td>
                    <td className="list-project">{task.projectId}</td>
                    <td>
                      <div className="list-status">
                        {getStatusIcon(task.status)}
                        <span className="list-status-text">{task.status}</span>
                      </div>
                    </td>
                    <td>
                      <span className="list-priority-badge" style={{ color: getPriorityColor(task.priority), border: `1px solid ${getPriorityColor(task.priority)}` }}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="list-due-date">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <button className="more-btn"><MoreHorizontal size={18} /></button>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={6}>No tasks found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project ID</label>
                <input 
                  type="text" 
                  required
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="form-select"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date" 
                    value={newTask.due}
                    onChange={(e) => setNewTask({...newTask, due: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
