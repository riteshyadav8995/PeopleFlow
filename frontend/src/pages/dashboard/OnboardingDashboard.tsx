import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Rocket, BookOpen, Zap, Clock, ShieldCheck, Plus, CheckCircle2, AlertCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { onboardingService } from '@/services/onboarding.service';
import './OnboardingDashboard.css';

interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: { id: string; title: string; category: string; isMandatory: boolean; dueDaysOffset: number }[];
}

interface OnboardingWorkflow {
  id: string;
  status: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  template: {
    name: string;
  };
  tasks: {
    id: string;
    title: string;
    status: string;
    isMandatory: boolean;
    dueDate: string;
    completedAt?: string;
  }[];
}

interface MyTask {
  id: string;
  title: string;
  status: string;
  isMandatory: boolean;
  dueDate: string;
  completedAt?: string;
  workflow: {
    template: { name: string };
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

type Tab = 'overview' | 'my-tasks' | 'templates';

export function OnboardingDashboard() {
  const { user } = useAuthStore();
  const organizationId = (user as any)?.organizationId || '';
  const isAdmin = user?.roles.includes('tenant_admin') || user?.roles.includes('super_admin');
  const queryClient = useQueryClient();

  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Assign workflow modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignForm, setAssignForm] = useState({ employeeIds: [] as string[], templateId: '' });
  const [empSearch, setEmpSearch] = useState('');
  const [tmplSearch, setTmplSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Create template modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    description: '',
    tasks: [{ title: '', category: 'EMPLOYEE', isMandatory: true, dueDaysOffset: 1 }],
  });

  // Template actions
  const [activeTemplateMenu, setActiveTemplateMenu] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<OnboardingTemplate | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveTemplateMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const templRes = await api.get('/onboarding/templates', { params: { organizationId } });
      setTemplates(templRes.data.data || []);
    } catch { setTemplates([]); }

    try {
      const taskRes = await api.get('/onboarding/tasks/me');
      setMyTasks(taskRes.data.data || []);
    } catch { setMyTasks([]); }

    if (isAdmin) {
      try {
        const empRes = await api.get('/employees', { params: { organizationId, limit: 100 } });
        setEmployees(empRes.data.data || []);
      } catch { setEmployees([]); }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const handleAssignWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignForm.employeeIds.length === 0) {
      showMessage('Please click on at least one employee from the list to select them.', 'error');
      return;
    }
    if (!assignForm.templateId) {
      showMessage('Please choose a template.', 'error');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        assignForm.employeeIds.map(empId =>
          api.post('/onboarding/workflows', { employeeId: empId, templateId: assignForm.templateId })
        )
      );
      setIsAssignModalOpen(false);
      showMessage('Onboarding workflow assigned successfully!');
      setAssignForm({ employeeIds: [], templateId: '' });
      setEmpSearch('');
      setTmplSearch('');
      queryClient.invalidateQueries({ queryKey: ['orgWorkflows'] });
      fetchData();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to assign workflow.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (templateForm.id) {
        await api.patch(`/onboarding/templates/${templateForm.id}`, { ...templateForm, organizationId });
        showMessage('Template updated successfully!');
      } else {
        await api.post('/onboarding/templates', { ...templateForm, organizationId });
        showMessage('Template created successfully!');
      }
      setIsTemplateModalOpen(false);
      setTemplateForm({ id: '', name: '', description: '', tasks: [{ title: '', category: 'EMPLOYEE', isMandatory: true, dueDaysOffset: 1 }] });
      fetchData();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to save template.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await api.patch(`/onboarding/tasks/${taskId}/complete`);
      setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED', completedAt: new Date().toISOString() } : t));
      showMessage('Task marked as complete!');
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to complete task.', 'error');
    }
  };

  const { data: workflowsData, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['orgWorkflows', organizationId],
    queryFn: () => onboardingService.getWorkflows(organizationId),
    retry: false,
    enabled: !!organizationId,
  });

  const workflows = (workflowsData || []).map((wf: any) => {
    const completedTasks = wf.tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const progress = wf.tasks.length > 0 ? Math.round((completedTasks / wf.tasks.length) * 100) : 0;
    return {
      id: wf.id,
      name: `${wf.employee.firstName} ${wf.employee.lastName}`,
      template: wf.template.name,
      progress,
      pending: wf.tasks.length - completedTasks + ' tasks left'
    };
  });

  const pendingTasks = myTasks.filter(t => t.status !== 'COMPLETED').length;
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      await api.delete(`/onboarding/templates/${templateToDelete.id}`);
      showMessage('Template deleted successfully');
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      setIsDeleteModalOpen(false);
      setTemplateToDelete(null);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to delete template', 'error');
    }
  };

  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="onboarding-container page-container">
      {/* Hero */}
      <div className="onboarding-hero">
        <div>
          <h1 className="onboarding-title">
            <span className="onboarding-title-icon"><Rocket size={32} /></span>
            Onboarding Center
          </h1>
          <p className="onboarding-subtitle">
            Manage the entire employee lifecycle from pre-joining portals to 90-day integration plans with automated workflows.
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-start-onboarding" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }} onClick={() => setIsTemplateModalOpen(true)}>
              <Plus size={16} /> New Template
            </button>
            <button className="btn-start-onboarding" onClick={() => setIsAssignModalOpen(true)}>
              <Rocket size={16} /> Start Onboarding
            </button>
          </div>
        )}
      </div>

      {message && (
        <div style={{ padding: '0.75rem 1rem', background: messageType === 'success' ? 'var(--success-glow)' : 'var(--danger-glow)', color: messageType === 'success' ? 'var(--success)' : 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {messageType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="ob-stats-grid">
        <div className="ob-stat-card ob-warning">
          <div className="ob-stat-icon-box"><Clock size={16} /></div>
          <span className="ob-stat-label">Active Journeys:</span>
          <span className="ob-stat-value">{workflows.length}</span>
        </div>
        <div className="ob-stat-card ob-success">
          <div className="ob-stat-icon-box"><CheckCircle2 size={16} /></div>
          <span className="ob-stat-label">My Tasks Completed:</span>
          <span className="ob-stat-value">{completedTasks}</span>
        </div>
        <div className="ob-stat-card ob-brand">
          <div className="ob-stat-icon-box"><Zap size={16} /></div>
          <span className="ob-stat-label">Templates Created:</span>
          <span className="ob-stat-value">{templates.length}</span>
        </div>
        <div className="ob-stat-card ob-info">
          <div className="ob-stat-icon-box"><ShieldCheck size={16} /></div>
          <span className="ob-stat-label">Pending My Tasks:</span>
          <span className="ob-stat-value">{pendingTasks}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="onboarding-tabs">
        <button className={`onboarding-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <Rocket size={16} /> Active Journeys
        </button>
        <button className={`onboarding-tab ${activeTab === 'my-tasks' ? 'active' : ''}`} onClick={() => setActiveTab('my-tasks')}>
          <CheckCircle2 size={16} /> My Tasks {pendingTasks > 0 && `(${pendingTasks})`}
        </button>
        <button className={`onboarding-tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
          <BookOpen size={16} /> Templates
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="onboarding-grid">
          {/* Active Journeys */}
          <div className="content-card">
            <div className="content-card-header">
              <span className="content-card-title">Ongoing Onboarding</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{workflows.length} active</span>
            </div>
            <div className="content-card-body">
              {workflows.map((wf: any, idx: number) => {
                const progressColor = wf.progress >= 80 ? 'var(--success)' : wf.progress >= 50 ? '#3b82f6' : 'var(--warning)';
                return (
                  <div key={idx} className="workflow-item">
                    <div className="workflow-item-header">
                      <div>
                        <div className="workflow-employee">
                          <div className="workflow-avatar">{wf.name.charAt(0)}</div>
                          {wf.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{wf.template}</div>
                      </div>
                      <div className="workflow-status-badge" style={{ background: progressColor + '20', color: progressColor }}>
                        {wf.progress}%
                      </div>
                    </div>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-fill" style={{ width: `${wf.progress}%`, background: progressColor }} />
                    </div>
                    <div className="progress-text">
                      <span>Pending: {wf.pending}</span>
                      <span>{wf.progress}% complete</span>
                    </div>
                  </div>
                );
              })}
              {workflows.length === 0 && <p className="list-empty">No active onboarding journeys.</p>}
            </div>
          </div>

          {/* Templates preview */}
          <div className="content-card">
            <div className="content-card-header">
              <span className="content-card-title">Available Templates</span>
              {isAdmin && (
                <button className="btn-start-onboarding" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', boxShadow: 'none' }} onClick={() => {
                  setTemplateForm({ id: '', name: '', description: '', tasks: [{ title: '', category: 'EMPLOYEE', isMandatory: true, dueDaysOffset: 1 }] });
                  setIsTemplateModalOpen(true);
                }}>
                  <Plus size={14} /> New
                </button>
              )}
            </div>
            <div className="content-card-body">
              {loading ? (
                <p className="list-empty">Loading templates...</p>
              ) : templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>No templates yet.</p>
                  {isAdmin && <button className="btn-start-onboarding" style={{ margin: '0.75rem auto 0', display: 'flex', boxShadow: 'none' }} onClick={() => {
                    setTemplateForm({ id: '', name: '', description: '', tasks: [{ title: '', category: 'EMPLOYEE', isMandatory: true, dueDaysOffset: 1 }] });
                    setIsTemplateModalOpen(true);
                  }}><Plus size={14} /> Create First Template</button>}
                </div>
              ) : (
                templates.map(tmpl => (
                  <div key={tmpl.id} className="template-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="template-icon-wrapper"><BookOpen size={18} /></div>
                      <div>
                        <div className="template-name">{tmpl.name}</div>
                        <div className="template-desc">{tmpl.tasks.length} tasks • {tmpl.description || 'Custom workflow'}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="btn-start-onboarding" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-md)', boxShadow: 'none', whiteSpace: 'nowrap' }} onClick={() => { setAssignForm(p => ({ ...p, templateId: tmpl.id })); setIsAssignModalOpen(true); }}>
                          Assign
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)', borderRadius: '4px' }}
                            onClick={(e) => { e.stopPropagation(); setActiveTemplateMenu(activeTemplateMenu === tmpl.id ? null : tmpl.id); }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {activeTemplateMenu === tmpl.id && (
                            <div
                              style={{
                                position: 'absolute', right: 0, top: '100%', marginTop: '0.25rem',
                                background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                zIndex: 9999, minWidth: '140px', overflow: 'hidden'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                                onClick={() => {
                                  setTemplateForm({
                                    id: tmpl.id,
                                    name: tmpl.name,
                                    description: tmpl.description || '',
                                    tasks: tmpl.tasks.map(t => ({ title: t.title, category: t.category, isMandatory: t.isMandatory, dueDaysOffset: t.dueDaysOffset }))
                                  });
                                  setIsTemplateModalOpen(true);
                                  setActiveTemplateMenu(null);
                                }}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: 'var(--danger)' }}
                                onClick={() => {
                                  setTemplateToDelete(tmpl);
                                  setIsDeleteModalOpen(true);
                                  setActiveTemplateMenu(null);
                                }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Tasks Tab */}
      {activeTab === 'my-tasks' && (
        <div className="content-card">
          <div className="content-card-header">
            <span className="content-card-title">My Onboarding Tasks</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pendingTasks} pending · {completedTasks} done</span>
          </div>
          <div className="content-card-body" style={{ maxHeight: 'none' }}>
            {loading ? (
              <p className="list-empty">Loading tasks...</p>
            ) : myTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>No onboarding tasks assigned to you yet.</p>
              </div>
            ) : (
              myTasks.map(task => (
                <div key={task.id} className={`task-item ${task.status === 'COMPLETED' ? 'completed' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ marginTop: '0.1rem', color: task.status === 'COMPLETED' ? 'var(--success)' : 'var(--gray-300)' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="task-title" style={{ textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                        {task.title}
                        {task.isMandatory && <span style={{ color: 'var(--danger)', marginLeft: '0.25rem', fontSize: '0.7rem' }}>*Required</span>}
                      </div>
                      <div className="task-due">
                        {task.status === 'COMPLETED'
                          ? `Completed ${new Date(task.completedAt!).toLocaleDateString()}`
                          : `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                        {' • '}{task.workflow.template.name}
                      </div>
                    </div>
                  </div>
                  {task.status !== 'COMPLETED' && (
                    <button className="btn-complete-task" onClick={() => handleCompleteTask(task.id)}>
                      Mark Done
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="content-card">
          <div className="content-card-header">
            <span className="content-card-title">Onboarding Templates</span>
            {isAdmin && (
              <button className="btn-start-onboarding" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', boxShadow: 'none' }} onClick={() => setIsTemplateModalOpen(true)}>
                <Plus size={14} /> New Template
              </button>
            )}
          </div>
          <div className="content-card-body" style={{ maxHeight: 'none' }}>
            {templates.length === 0 ? (
              <p className="list-empty">No templates found. Create one to start building onboarding workflows.</p>
            ) : (
              templates.map(tmpl => (
                <div key={tmpl.id} className="workflow-item">
                  <div className="workflow-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="template-icon-wrapper"><BookOpen size={20} /></div>
                      <div>
                        <div className="workflow-name">{tmpl.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tmpl.description}</div>
                      </div>
                    </div>
                    <span className="workflow-status-badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                      {tmpl.tasks.length} Tasks
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
                    {tmpl.tasks.slice(0, 4).map((task, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', background: 'var(--gray-100)', borderRadius: '9999px', color: 'var(--text-secondary)' }}>
                        {task.title}
                      </span>
                    ))}
                    {tmpl.tasks.length > 4 && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', background: 'var(--gray-200)', borderRadius: '9999px', color: 'var(--text-muted)' }}>
                        +{tmpl.tasks.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Assign Workflow Modal */}
      {isAssignModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'inherit'
        }}>
          {/* Top Bar */}
          <div style={{
            padding: '0.875rem 2.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(124,58,237,0.06))',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#a78bfa,#7c3aed)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Start Onboarding Journey
              </h2>
            </div>
            <button onClick={() => setIsAssignModalOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: '1.5rem', transition: 'background 0.15s'
            }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--gray-100)')}
              onMouseOut={e => (e.currentTarget.style.background = 'none')}
            >&times;</button>
          </div>

          <form onSubmit={handleAssignWorkflow} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2.5rem' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Select Employees *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search employees..." 
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <select 
                    className="form-select" 
                    multiple 
                    value={assignForm.employeeIds} 
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setAssignForm(p => ({ ...p, employeeIds: selected }));
                    }}
                    style={{ height: '120px' }}
                  >
                    {employees.filter(emp => `${emp.firstName} ${emp.lastName} ${emp.employeeCode}`.toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Hold Ctrl/Cmd to select multiple employees</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Template *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search templates..." 
                    value={tmplSearch}
                    onChange={e => setTmplSearch(e.target.value)}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <select className="form-select" value={assignForm.templateId} onChange={e => setAssignForm(p => ({ ...p, templateId: e.target.value }))}>
                    <option value="">— Choose Template —</option>
                    {templates.filter(t => t.name.toLowerCase().includes(tmplSearch.toLowerCase())).map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.tasks.length} tasks)</option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.25rem' }}>No templates yet — create one first.</p>
                  )}
                </div>
              </div>
            </div>
            <div style={{
              padding: '1rem 2.5rem', borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '1rem'
            }}>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{
                padding: '0.625rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                background: '#fff', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
              }}>Cancel</button>
              <button type="submit" disabled={saving || templates.length === 0} style={{
                padding: '0.625rem 1.5rem', border: 'none', borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 600, cursor: (saving || templates.length === 0) ? 'not-allowed' : 'pointer'
              }}>
                {saving ? 'Assigning...' : 'Start Journey'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Template Modal */}
      {isTemplateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'inherit'
        }}>
          {/* Top Bar */}
          <div style={{
            padding: '0.875rem 2.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(124,58,237,0.06))',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#a78bfa,#7c3aed)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {templateForm.id ? 'Edit Onboarding Template' : 'Create Onboarding Template'}
              </h2>
            </div>
            <button onClick={() => setIsTemplateModalOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: '1.5rem', transition: 'background 0.15s'
            }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--gray-100)')}
              onMouseOut={e => (e.currentTarget.style.background = 'none')}
            >&times;</button>
          </div>

          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2.5rem' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Template Name *</label>
                  <input className="form-select" style={{ padding: '0.75rem' }} required placeholder="e.g. Standard Employee Onboarding" value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-select" style={{ padding: '0.75rem' }} placeholder="Brief description" value={templateForm.description} onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', marginTop: '1rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Tasks *</label>
                  <button type="button" className="btn-secondary-modal" onClick={() => setTemplateForm(p => ({ ...p, tasks: [...p.tasks, { title: '', category: 'EMPLOYEE', isMandatory: true, dueDaysOffset: 1 }] }))}>
                    + Add Task
                  </button>
                </div>

                {templateForm.tasks.map((task, i) => (
                  <div key={i} style={{ background: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                      <input className="form-select" style={{ padding: '0.5rem' }} required placeholder={`Task ${i + 1} title`} value={task.title}
                        onChange={e => setTemplateForm(p => ({ ...p, tasks: p.tasks.map((t, j) => j === i ? { ...t, title: e.target.value } : t) }))} />
                      {templateForm.tasks.length > 1 && (
                        <button type="button" style={{ background: 'var(--danger-glow)', color: 'var(--danger)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                          onClick={() => setTemplateForm(p => ({ ...p, tasks: p.tasks.filter((_, j) => j !== i) }))}>
                          ×
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <select className="form-select" style={{ padding: '0.5rem', fontSize: '0.8rem' }} value={task.category}
                        onChange={e => setTemplateForm(p => ({ ...p, tasks: p.tasks.map((t, j) => j === i ? { ...t, category: e.target.value } : t) }))}>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HR">HR</option>
                        <option value="IT">IT</option>
                      </select>
                      <input type="number" className="form-select" style={{ padding: '0.5rem', fontSize: '0.8rem' }} placeholder="Due in days" min={0} value={task.dueDaysOffset}
                        onChange={e => setTemplateForm(p => ({ ...p, tasks: p.tasks.map((t, j) => j === i ? { ...t, dueDaysOffset: Number(e.target.value) } : t) }))} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={task.isMandatory} onChange={e => setTemplateForm(p => ({ ...p, tasks: p.tasks.map((t, j) => j === i ? { ...t, isMandatory: e.target.checked } : t) }))} />
                        Mandatory
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              padding: '1rem 2.5rem', borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '1rem'
            }}>
              <button type="button" onClick={() => setIsTemplateModalOpen(false)} style={{
                padding: '0.625rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                background: '#fff', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
              }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                padding: '0.625rem 1.5rem', border: 'none', borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer'
              }}>
                {saving ? 'Saving...' : templateForm.id ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && templateToDelete && (
        <div className="modal-overlay" style={{ left: '16rem', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', zIndex: 100, background: 'rgba(10, 15, 30, 0.55)', backdropFilter: 'blur(2px)' }}>
          <div className="modal-content" style={{ background: 'var(--bg-surface)', maxWidth: '400px', height: 'auto', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Delete Template</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Are you really want to delete <strong>{templateToDelete.name}</strong>? This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                style={{ flex: 1, padding: '0.625rem', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}
                onClick={() => { setIsDeleteModalOpen(false); setTemplateToDelete(null); }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                style={{ flex: 1, padding: '0.625rem', border: 'none', background: 'var(--danger)', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 500, cursor: 'pointer' }}
                onClick={handleDeleteTemplate}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
