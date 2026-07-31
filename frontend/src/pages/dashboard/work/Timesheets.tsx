import React, { useState } from 'react';
import { Calendar, Save, Send, Plus, Trash2 } from 'lucide-react';
import './Timesheets.css';

export function Timesheets() {
  const [viewType, setViewType] = useState<'weekly' | 'daily'>('weekly');
  const [week, setWeek] = useState('2024-W47');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  const [entries, setEntries] = useState<any[]>([]);

  const addEntry = () => {
    setEntries([...entries, { id: Date.now(), project: '', task: '', mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, dailyHours: 0 }]);
  };

  const removeEntry = (id: number) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const calculateTotal = (day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'dailyHours') => {
    return entries.reduce((sum, entry) => sum + (Number(entry[day]) || 0), 0);
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
          <button className="btn-secondary">
            <Send size={18} /> Submit
          </button>
        </div>
      </div>

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
                      defaultValue={entry.project} 
                      placeholder="Select Project" 
                      className="cell-input" 
                    />
                  </td>
                  <td className="td-wide">
                    <input 
                      type="text" 
                      defaultValue={entry.task} 
                      placeholder="Task description" 
                      className="cell-input" 
                    />
                  </td>
                  {viewType === 'weekly' ? (
                    <>
                      <td className="td-day"><input type="number" min="0" max="24" defaultValue={entry.mon} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" defaultValue={entry.tue} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" defaultValue={entry.wed} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" defaultValue={entry.thu} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" defaultValue={entry.fri} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" defaultValue={entry.sat} className="cell-input number" /></td>
                      <td className="td-day"><input type="number" min="0" max="24" defaultValue={entry.sun} className="cell-input number" /></td>
                      <td className="td-total">
                        {(Number(entry.mon)||0) + (Number(entry.tue)||0) + (Number(entry.wed)||0) + (Number(entry.thu)||0) + (Number(entry.fri)||0) + (Number(entry.sat)||0) + (Number(entry.sun)||0)}
                      </td>
                    </>
                  ) : (
                    <td className="td-wide">
                      <input type="number" min="0" max="24" defaultValue={entry.dailyHours} className="cell-input number" />
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
