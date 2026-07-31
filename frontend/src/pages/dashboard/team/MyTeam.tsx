import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users2, Search, Mail, Phone, MapPin } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import './MyTeam.css';

export function MyTeam() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [searchTerm, setSearchTerm] = useState('');

  // Fallback to decode JWT if employeeId is missing from older cached user object
  const getEmployeeId = () => {
    if (user?.employeeId) return user.employeeId;
    const token = useAuthStore.getState().accessToken;
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).employeeId;
    } catch (e) {
      return null;
    }
  };
  
  const managerId = getEmployeeId();

  const { data: team, isLoading } = useQuery({
    queryKey: ['myTeam', organizationId, managerId],
    queryFn: async () => {
      // Pass managerId to get only direct reports
      const res = await api.get('/employee', { 
        params: { 
          organizationId, 
          managerId 
        } 
      });
      return res.data.data;
    },
    enabled: !!organizationId && !!managerId
  });

  const filteredTeam = team?.filter((emp: any) => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="my-team-container page-container">
      <div className="team-header">
        <div className="team-title-wrapper">
          <h1 className="team-title">
            <Users2 className="team-title-icon" size={24} />
            My Team
          </h1>
          <p className="team-subtitle">Direct reports and team members under your supervision.</p>
        </div>
      </div>

      <div className="team-search-bar">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Search team by name or designation..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner />
        </div>
      ) : filteredTeam?.length === 0 ? (
        <div className="empty-state">
          <Users2 className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">No team members found</h3>
          <p className="empty-state-text">You don't have any direct reports assigned to you yet.</p>
        </div>
      ) : (
        <div className="team-grid">
          {filteredTeam?.map((emp: any) => (
            <div key={emp.id} className="team-card">
              <div className="team-card-banner"></div>
              <div className="team-card-body">
                <div className="team-avatar-wrapper">
                  <div className="team-avatar">
                    {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                  </div>
                </div>
                
                <div className="team-card-content">
                  <div className="team-info-header">
                    <div>
                      <h3 className="team-name">{emp.firstName} {emp.lastName}</h3>
                      <p className="team-role">{emp.designation?.title || 'No Designation'}</p>
                      <p className="team-dept">{emp.department?.name || 'No Department'}</p>
                    </div>
                    <span className={`status-badge ${emp.status === 'active' ? 'active' : 'inactive'}`}>
                      {emp.status}
                    </span>
                  </div>
                  
                  <div className="team-contact-info">
                    <div className="contact-item">
                      <Mail className="contact-icon" size={16} />
                      <span className="contact-text">{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div className="contact-item">
                        <Phone className="contact-icon" size={16} />
                        <span className="contact-text">{emp.phone}</span>
                      </div>
                    )}
                    {emp.branch?.name && (
                      <div className="contact-item">
                        <MapPin className="contact-icon" size={16} />
                        <span className="contact-text">{emp.branch.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
