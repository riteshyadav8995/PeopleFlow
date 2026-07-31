import React, { useState } from 'react';
import { Search, FileText, Download, BookOpen, Shield, Heart, Monitor } from 'lucide-react';
import './CompanyPolicies.css';

export function CompanyPolicies() {
  const [searchTerm, setSearchTerm] = useState('');

  const policies = [
    { id: 'POL-001', title: 'Code of Conduct', category: 'General', lastUpdated: '10 Jan 2024', size: '2.4 MB', icon: BookOpen, color: '#3b82f6' },
    { id: 'POL-002', title: 'Data Privacy & Security', category: 'IT', lastUpdated: '15 Feb 2024', size: '1.8 MB', icon: Shield, color: '#10b981' },
    { id: 'POL-003', title: 'Leave & Attendance Policy', category: 'HR', lastUpdated: '01 Nov 2024', size: '3.1 MB', icon: FileText, color: '#f59e0b' },
    { id: 'POL-004', title: 'Health & Safety Guidelines', category: 'General', lastUpdated: '20 Mar 2024', size: '1.2 MB', icon: Heart, color: '#ef4444' },
    { id: 'POL-005', title: 'Remote Work Policy', category: 'IT & HR', lastUpdated: '05 May 2024', size: '1.5 MB', icon: Monitor, color: '#8b5cf6' },
  ];

  const filteredPolicies = policies.filter(pol => 
    pol.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pol.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="policies-container page-container">
      <div className="policies-header">
        <div>
          <h1 className="policies-title">Company Policies</h1>
          <p className="policies-subtitle">Access and download important company guidelines and procedures.</p>
        </div>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search policies..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="policies-grid">
        {filteredPolicies.map((pol) => (
          <div key={pol.id} className="policy-card">
            <div 
              className="policy-icon-wrapper" 
              style={{ background: `${pol.color}15`, color: pol.color }}
            >
              <pol.icon size={24} />
            </div>
            
            <div className="policy-content">
              <div className="policy-title">{pol.title}</div>
              <div className="policy-meta">
                <span className="policy-category">{pol.category}</span>
                <span>•</span>
                <span>Updated {pol.lastUpdated}</span>
              </div>
            </div>

            <button className="btn-download">
              <Download size={18} />
            </button>
          </div>
        ))}
        {filteredPolicies.length === 0 && (
          <div className="empty-state">
            No policies found matching "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
