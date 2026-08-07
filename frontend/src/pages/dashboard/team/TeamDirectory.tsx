import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import './TeamDirectory.css';

export function TeamDirectory() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Fetch all employees in the organization for the directory
  const { data: directory, isLoading } = useQuery({
    queryKey: ['teamDirectory', organizationId],
    queryFn: async () => {
      const res = await api.get('/employee', { 
        params: { organizationId } 
      });
      return res.data.data;
    },
    enabled: !!organizationId
  });

  const filteredDirectory = directory?.filter((emp: any) => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="directory-container page-container">
      <div className="directory-header">
        <div className="directory-title-wrapper">
          <h1 className="directory-title">
            <BookOpen className="directory-title-icon" size={24} />
            Team Directory
          </h1>
          <p className="directory-subtitle">Contact information for all team members.</p>
        </div>
      </div>

      <div className="directory-card">
        <div className="directory-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input 
              type="text"
              placeholder="Search by name, email, or department..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        ) : filteredDirectory?.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">No members found</h3>
            <p className="empty-state-text">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact</th>
                  <th>Role & Department</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredDirectory?.map((emp: any) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="employee-cell">
                        <div>
                          <div 
                            className="employee-name" 
                            style={{ cursor: 'pointer', color: 'var(--brand-600)', textDecoration: 'underline' }}
                            onClick={() => setSelectedEmployee(emp)}
                          >
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="employee-id">ID: {emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-item">
                          <Mail size={14} className="contact-icon" /> {emp.email}
                        </div>
                        {emp.phone && (
                          <div className="contact-item">
                            <Phone size={14} className="contact-icon" /> {emp.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="role-title">{emp.designation?.title || '-'}</div>
                      <div className="role-dept">
                        <Building2 size={12} /> {emp.department?.name || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <MapPin size={14} className="contact-icon" />
                        {emp.branch?.name || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0f172a' }}>
              Employee Details
              <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Name</div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem', color: '#1e293b' }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Employee ID</div>
                <div style={{ color: '#334155' }}>{selectedEmployee.employeeCode}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Email</div>
                <div style={{ color: '#334155' }}>{selectedEmployee.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Phone</div>
                <div style={{ color: '#334155' }}>{selectedEmployee.phone || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Role</div>
                <div style={{ color: '#334155' }}>{selectedEmployee.designation?.title || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Department</div>
                <div style={{ color: '#334155' }}>{selectedEmployee.department?.name || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Location</div>
                <div style={{ color: '#334155' }}>{selectedEmployee.branch?.name || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
