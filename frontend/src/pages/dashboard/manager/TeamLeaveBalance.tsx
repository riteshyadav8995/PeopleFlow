import React, { useState } from 'react';
import { Calendar, Search, ChevronUp, ChevronDown, UserCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import './TeamLeaveBalance.css';

export function TeamLeaveBalance() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('employee');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Fetch team members with leave balances
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['teamLeaveBalance', organizationId, user?.employeeId],
    queryFn: async () => {
      const res = await api.get('/employee', { params: { organizationId, managerId: user?.employeeId } });
      const employees = res.data.data || [];
      
      // Fetch leave balances for each employee
      const withBalances = await Promise.all(employees.map(async (emp: any) => {
        try {
          const balRes = await api.get('/leave-balance', { params: { employeeId: emp.id, organizationId } });
          const balances = balRes.data.data || [];
          const casual = balances.find((b: any) => b.leaveType?.name?.toLowerCase().includes('casual'))?.balance || 0;
          const sick = balances.find((b: any) => b.leaveType?.name?.toLowerCase().includes('sick'))?.balance || 0;
          const earned = balances.find((b: any) => b.leaveType?.name?.toLowerCase().includes('earned') || b.leaveType?.name?.toLowerCase().includes('privilege'))?.balance || 0;
          const total = balances.reduce((sum: number, b: any) => sum + (b.balance || 0), 0);
          return {
            id: emp.id,
            employee: `${emp.firstName} ${emp.lastName}`,
            role: emp.designation?.title || 'Employee',
            casual, sick, earned, total,
            firstName: emp.firstName,
            lastName: emp.lastName
          };
        } catch {
          return {
            id: emp.id,
            employee: `${emp.firstName} ${emp.lastName}`,
            role: emp.designation?.title || 'Employee',
            casual: 0, sick: 0, earned: 0, total: 0,
            firstName: emp.firstName,
            lastName: emp.lastName
          };
        }
      }));
      return withBalances;
    },
    enabled: !!organizationId && !!user?.employeeId
  });

  const balances = teamMembers || [];

  const filtered = balances
    .filter((b: any) => b.employee.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a: any, b: any) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: string }) => (
    sortField === field ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null
  );

  return (
    <div className="tlb-container">
      <div className="tlb-header">
        <div className="tlb-title-wrapper">
          <h1 className="tlb-title">
            <div className="tlb-icon-wrapper">
              <Calendar size={24} />
            </div>
            Team Leave Balance
          </h1>
          <p className="tlb-subtitle">Overview of leave balances for your direct reports.</p>
        </div>
      </div>

      <div className="tlb-data-section">
        <div className="data-section-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by employee name..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #4338ca', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            </div>
            <h3 className="empty-title">Loading Balances...</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <UserCircle className="empty-icon" size={32} />
            </div>
            <h3 className="empty-title">No team members found</h3>
            <p className="empty-subtitle">We couldn't find any team members matching your search criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tlb-table">
              <thead>
                <tr>
                  <th>
                    <div onClick={() => toggleSort('employee')} className="tlb-sortable">
                      Employee <SortIcon field="employee" />
                    </div>
                  </th>
                  <th>
                    <div onClick={() => toggleSort('casual')} className="tlb-sortable">
                      Casual <SortIcon field="casual" />
                    </div>
                  </th>
                  <th>
                    <div onClick={() => toggleSort('sick')} className="tlb-sortable">
                      Sick <SortIcon field="sick" />
                    </div>
                  </th>
                  <th>
                    <div onClick={() => toggleSort('earned')} className="tlb-sortable">
                      Earned <SortIcon field="earned" />
                    </div>
                  </th>
                  <th>
                    <div onClick={() => toggleSort('total')} className="tlb-sortable">
                      Total <SortIcon field="total" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b: any) => (
                  <tr key={b.id} className="table-row">
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {b.firstName?.charAt(0)}{b.lastName?.charAt(0)}
                        </div>
                        <div className="employee-info">
                          <div className="employee-name">{b.employee}</div>
                          <div className="employee-role">{b.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="val-leave">{b.casual}</td>
                    <td className="val-leave">{b.sick}</td>
                    <td className="val-leave">{b.earned}</td>
                    <td className="val-total">{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
