import React, { useState } from 'react';
import { Calendar, Save, Send, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import './Timesheets.css';

export function Timesheets() {
  const [viewType, setViewType] = useState<'weekly' | 'daily'>('weekly');
  const [week, setWeek] = useState('2024-W47');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  const [entries, setEntries] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { user } = useAuthStore();

  const updateEntry = (id: number, field: string, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addEntry = () => {
    setEntries([...entries, { id: Date.now(), project: '', task: '', mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, dailyHours: 0 }]);
  };

  const removeEntry = (id: number) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const calculateTotal = (day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'dailyHours') => {
    return entries.reduce((sum, entry) => sum + (Number(entry[day]) || 0), 0);
  };

  const getWeekDate = (weekStr: string, dayOffset: number) => {
    const [yearStr, weekNumStr] = weekStr.split('-W');
    const year = parseInt(yearStr, 10);
    const weekNum = parseInt(weekNumStr, 10);
    const date = new Date(year, 0, 1);
    const days = (weekNum - 1) * 7;
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) + days;
    date.setDate(diff + dayOffset);
    return date;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setMessage('');
      const timeEntryIds: string[] = [];
      let totalHours = 0;

      // Log time for each entry
      for (const entry of entries) {
        if (!entry.project && !entry.task) continue;
        const desc = `${entry.project} - ${entry.task}`.trim();

        if (viewType === 'weekly') {
          const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
          for (let i = 0; i < 7; i++) {
            const hours = Number(entry[days[i]]) || 0;
            if (hours > 0) {
              const d = getWeekDate(week, i);
              const res = await api.post('/timesheet/log', {
                date: d.toISOString(),
                hours,
                description: desc,
                projectId: null,
                taskId: null
              });
              timeEntryIds.push(res.data.data.id);
              totalHours += hours;
            }
          }
        } else {
          const hours = Number(entry.dailyHours) || 0;
          if (hours > 0) {
            const res = await api.post('/timesheet/log', {
              date: new Date(dailyDate).toISOString(),
              hours,
              description: desc,
              projectId: null,
              taskId: null
            });
            timeEntryIds.push(res.data.data.id);
            totalHours += hours;
          }
        }
      }

      if (timeEntryIds.length === 0) {
        setMessage('No hours to submit. Please add some entries.');
        setMessageType('error');
        setIsSubmitting(false);
        return;
      }

      let periodStart, periodEnd;
      if (viewType === 'weekly') {
        periodStart = getWeekDate(week, 0);
        periodEnd = getWeekDate(week, 6);
      } else {
        periodStart = new Date(dailyDate);
        periodEnd = new Date(dailyDate);
      }

      // Submit timesheet
      await api.post('/timesheet/', {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        totalHours,
        timeEntryIds
      });

      setMessage('Timesheet submitted successfully!');
      setMessageType('success');
      setEntries([]);
    } catch (error: any) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Failed to submit timesheet');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="timesheets-container page-container">
      <div className="timesheets-header">
        <div>
          <h1 className="timesheets-title">Timesheets</h1>
          <p className="timesheets-subtitle">Log your working hours against specific projects and tasks.</p>
        </div>
        <div className="timesheets-controls">
          <select 
            value={viewType}
            onChange={(e) => setViewType(e.target.value as 'weekly' | 'daily')}
            className="control-input select"
          >
            <option value="weekly">Weekly View</option>
            <option value="daily">Daily View</option>
          </select>
          {viewType === 'weekly' ? (
            <input 
              type="week" 
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="control-input"
            />
          ) : (
            <input 
              type="date" 
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="control-input"
            />
          )}
          <button className="btn-primary" onClick={addEntry}>
            <Plus size={18} /> Add Row
          </button>
          <button className="btn-secondary" onClick={handleSubmit} disabled={isSubmitting || entries.length === 0}>
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Submit
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', background: messageType === 'success' ? 'var(--success-glow)' : 'var(--danger-glow)', color: messageType === 'success' ? 'var(--success)' : 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {messageType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message}
        </div>
      )}

      <div className="timesheets-card">
        <div className="table-wrapper">
          <table className="timesheets-table">
            <thead>
              <tr>
                <th className="th-wide">Project</th>
                <th className="th-wide">Task</th>
                {viewType === 'weekly' ? (
                  <>
                    <th className="th-day">Mon</th>
                    <th className="th-day">Tue</th>
                    <th className="th-day">Wed</th>
                    <th className="th-day">Thu</th>
                    <th className="th-day">Fri</th>
                    <th className="th-day">Sat</th>
                    <th className="th-day">Sun</th>
                    <th className="th-total">Total</th>
                  </>
                ) : (
                  <th className="th-day">Hours</th>
                )}
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id}>
                  <td className="td-wide">
                    <input 
                      type="text" 
                      value={entry.project} 
                      onChange={(e) => updateEntry(entry.id, 'project', e.target.value)}
                      placeholder="Project name" 
                      className="cell-input" 
                    />
                  </td>
                  <td className="td-wide">
                    <input 
                      type="text" 
                      value={entry.task} 
                      onChange={(e) => updateEntry(entry.id, 'task', e.target.value)}
                      placeholder="Task description" 
                      className="cell-input" 
                    />
                  </td>
                  {viewType === 'weekly' ? (
                    <>
                      <td className="td-day"><input type="number" min="0" max="24" value={entry.mon || ''} onChange={(e) => updateEntry(entry.id, 'mon', e.target.value)} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" value={entry.tue || ''} onChange={(e) => updateEntry(entry.id, 'tue', e.target.value)} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" value={entry.wed || ''} onChange={(e) => updateEntry(entry.id, 'wed', e.target.value)} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" value={entry.thu || ''} onChange={(e) => updateEntry(entry.id, 'thu', e.target.value)} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" value={entry.fri || ''} onChange={(e) => updateEntry(entry.id, 'fri', e.target.value)} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" value={entry.sat || ''} onChange={(e) => updateEntry(entry.id, 'sat', e.target.value)} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" value={entry.sun || ''} onChange={(e) => updateEntry(entry.id, 'sun', e.target.value)} className="cell-input number" /></td>
                      <td className="td-total">
                        {(Number(entry.mon)||0) + (Number(entry.tue)||0) + (Number(entry.wed)||0) + (Number(entry.thu)||0) + (Number(entry.fri)||0) + (Number(entry.sat)||0) + (Number(entry.sun)||0)}
                      </td>
                    </>
                  ) : (
                    <td className="td-wide">
                      <input type="number" min="0" max="24" value={entry.dailyHours || ''} onChange={(e) => updateEntry(entry.id, 'dailyHours', e.target.value)} className="cell-input number" />
                    </td>
                  )}
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => removeEntry(entry.id)} className="delete-btn">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="tf-label">Total Hours:</td>
                {viewType === 'weekly' ? (
                  <>
                    <td className="tf-day-total">{calculateTotal('mon')}</td>
                    <td className="tf-day-total">{calculateTotal('tue')}</td>
                    <td className="tf-day-total">{calculateTotal('wed')}</td>
                    <td className="tf-day-total">{calculateTotal('thu')}</td>
                    <td className="tf-day-total">{calculateTotal('fri')}</td>
                    <td className="tf-day-total">{calculateTotal('sat')}</td>
                    <td className="tf-day-total">{calculateTotal('sun')}</td>
                    <td className="tf-grand-total">
                      {['mon','tue','wed','thu','fri','sat','sun'].reduce((acc, day) => acc + calculateTotal(day as any), 0)}
                    </td>
                  </>
                ) : (
                  <td className="tf-grand-total" style={{ padding: '1rem 1.5rem' }}>{calculateTotal('dailyHours')}</td>
                )}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
