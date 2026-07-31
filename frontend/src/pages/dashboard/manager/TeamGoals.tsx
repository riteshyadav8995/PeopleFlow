import React, { useState } from 'react';
import { Target, Plus, Search, CheckCircle, Clock, AlertCircle, BarChart, X } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { performanceService } from '../../../services/performance.service';
import './TeamGoals.css';

export function TeamGoals() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  // Fetch direct reports for goal assignment
  const { data: teamMembers } = useQuery({
    queryKey: ['myTeam', organizationId, user?.employeeId],
    queryFn: async () => {
      const res = await api.get('/employee', { params: { organizationId, managerId: user?.employeeId } });
      return res.data.data || [];
    },
    enabled: !!organizationId && !!user?.employeeId
  });

  const queryClient = useQueryClient();

  const { data: realGoals, isLoading: loadingGoals } = useQuery({
    queryKey: ['teamGoals'],
    queryFn: () => performanceService.getTeamGoals()
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => performanceService.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      setNewGoal({ title: '', assignee: '', priority: 'medium', dueDate: '' });
      setShowAddModal(false);
      showSuccess('Goal assigned successfully!');
    }
  });

  const goals = realGoals ? realGoals.map((g: any) => ({
    id: g.id,
    title: g.title,
    assignee: g.employee ? `${g.employee.firstName} ${g.employee.lastName}` : 'Unassigned',
    status: g.status,
    progress: g.progress,
    dueDate: g.dueDate.split('T')[0],
    priority: 'medium'
  })) : [];

  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', assignee: '', priority: 'medium', dueDate: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleAddGoal = () => {
    if (!newGoal.title) return;
    createGoalMutation.mutate({
      title: newGoal.title,
      employeeId: newGoal.assignee,
      dueDate: newGoal.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priority: newGoal.priority
    });
  };

  const updateProgress = (id: string, delta: number) => {
    // Requires a progress update mutation in backend
    showSuccess('Progress update requires backend mutation (Coming Soon)');
  };

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => performanceService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      showSuccess('Goal deleted!');
    }
  });

  const deleteGoal = (id: string) => {
    deleteGoalMutation.mutate(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track': return <CheckCircle size={14} />;
      case 'at_risk': return <AlertCircle size={14} />;
      case 'completed': return <Target size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const filtered = goals.filter((g: any) => activeFilter === 'all' || g.status === activeFilter);

  // Populate assignee names from team
  const teamNames = teamMembers?.map((m: any) => `${m.firstName} ${m.lastName}`) || [];

  return (
    <div className="team-goals-container">
      {successMsg && <div className="tg-success-toast">{successMsg}</div>}

      <div className="goals-header">
        <div>
          <h1 className="goals-title"><Target size={22} /> Team Goals</h1>
          <p className="goals-subtitle">Track objectives and key results for your team.</p>
        </div>
        <button className="goals-add-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Goal
        </button>
      </div>

      <div className="goals-filters">
        {['all', 'on_track', 'at_risk', 'not_started', 'completed'].map(f => (
          <button key={f} className={`goals-filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
            {getStatusLabel(f === 'all' ? 'all' : f)}
          </button>
        ))}
      </div>

      <div className="goals-list">
        {filtered.length === 0 && (
          <div className="goals-empty"><Target size={40} strokeWidth={1} /><p>No goals match this filter.</p></div>
        )}
        {filtered.map((goal: any) => (
          <div key={goal.id} className="goal-card">
            <div className="goal-card-header">
              <h3 className="goal-card-title">{goal.title}</h3>
              <span className={`goal-status-badge goal-status-${goal.status}`}>
                {getStatusIcon(goal.status)} {getStatusLabel(goal.status)}
              </span>
            </div>
            <div className="goal-card-meta">
              <span>Assigned: {goal.assignee}</span>
              <span>Due: {goal.dueDate}</span>
              <span className={`goal-priority goal-priority-${goal.priority}`}>{goal.priority}</span>
            </div>
            <div className="goal-progress-bar">
              <div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} />
            </div>
            <div className="goal-card-actions">
              <span className="goal-progress-label">{goal.progress}%</span>
              <div className="goal-btn-group">
                <button className="goal-action-btn" onClick={() => updateProgress(goal.id, -10)} title="Decrease">−10%</button>
                <button className="goal-action-btn goal-action-primary" onClick={() => updateProgress(goal.id, 10)} title="Increase">+10%</button>
                <button className="goal-action-btn goal-action-danger" onClick={() => deleteGoal(goal.id)} title="Remove">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="tg-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-header">
              <h2>Add New Goal</h2>
              <button className="tg-modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <div className="tg-modal-body">
              <label className="tg-label">Goal Title *</label>
              <input className="tg-input" placeholder="e.g. Improve test coverage" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} />

              <label className="tg-label">Assign To</label>
              <select className="tg-input" value={newGoal.assignee} onChange={e => setNewGoal({...newGoal, assignee: e.target.value})}>
                <option value="">Team (Everyone)</option>
                {teamNames.map((n: string) => <option key={n} value={n}>{n}</option>)}
              </select>

              <label className="tg-label">Priority</label>
              <select className="tg-input" value={newGoal.priority} onChange={e => setNewGoal({...newGoal, priority: e.target.value})}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <label className="tg-label">Due Date</label>
              <input className="tg-input" type="date" value={newGoal.dueDate} onChange={e => setNewGoal({...newGoal, dueDate: e.target.value})} />
            </div>
            <div className="tg-modal-footer">
              <button className="tg-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="tg-btn-submit" onClick={handleAddGoal} disabled={!newGoal.title}>Create Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
