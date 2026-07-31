import React from 'react';
import { Calendar, Download, PieChart, BarChart2 } from 'lucide-react';
import './LeaveReports.css';

export function LeaveReports() {
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const leaveData = [12, 15, 8, 22, 30, 45, 18, 10, 14, 25, 40, 15];
  const maxLeave = 45;

  return (
    <div className="leave-reports-container">
      <div className="lr-header">
        <div className="lr-title-wrapper">
          <h1 className="lr-title">
            <Calendar className="lr-icon" size={24} />
            Leave Analytics
          </h1>
          <p className="lr-subtitle">Analyze team leave trends and planned absences.</p>
        </div>
        <div className="lr-actions">
          <select className="lr-select">
            <option>Q3 2026</option>
            <option>Q2 2026</option>
            <option>YTD 2026</option>
          </select>
          <button className="lr-btn-export">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="lr-charts-grid">
        <div className="lr-chart-card">
          <div className="lr-chart-header">
            <h3 className="lr-chart-title">
              <PieChart className="lr-chart-title-icon" size={16} /> Leave Types Breakdown
            </h3>
            <p className="lr-chart-subtitle">Distribution of taken leaves</p>
          </div>
          <div className="lr-pie-container">
            <div className="lr-pie-chart"></div>
            <div className="lr-pie-legend">
              <div className="lr-legend-item"><div className="lr-legend-dot casual"></div> Casual (40%)</div>
              <div className="lr-legend-item"><div className="lr-legend-dot earned"></div> Earned (30%)</div>
              <div className="lr-legend-item"><div className="lr-legend-dot sick"></div> Sick (20%)</div>
              <div className="lr-legend-item"><div className="lr-legend-dot unpaid"></div> Unpaid (10%)</div>
            </div>
          </div>
        </div>

        <div className="lr-chart-card">
          <div className="lr-chart-header">
            <h3 className="lr-chart-title">
              <BarChart2 className="lr-chart-title-icon" size={16} /> Leaves by Month
            </h3>
            <p className="lr-chart-subtitle">Total leave days taken</p>
          </div>
          <div className="lr-bar-chart">
            {leaveData.map((val, idx) => (
              <div key={idx} className="lr-bar-group">
                <div 
                  className="lr-bar" 
                  style={{ height: `${(val / maxLeave) * 100}%` }}
                ></div>
                <div className="lr-bar-label">{months[idx]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
