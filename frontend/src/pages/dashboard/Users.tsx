import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, MoreVertical } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import './Users.css';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users?limit=50');
        setUsers(data.data);
      } catch (err) {
        console.warn('Backend unavailable, using dummy data');
        setUsers([
          {
            id: currentUser?.id || '1',
            firstName: currentUser?.firstName || 'Demo',
            lastName: currentUser?.lastName || 'User',
            email: currentUser?.email || 'demo@company.com',
            roles: currentUser?.roles || ['tenant_admin'],
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@company.com',
            roles: ['hr_admin'],
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser]);

  return (
    <div className="users-container page-container">
      <div className="users-header">
        <div>
          <h1 className="users-title">System Users</h1>
          <p className="users-subtitle">Manage access and roles for your organization.</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} /> Invite User
        </button>
      </div>

      <div className="users-card">
        <div className="users-toolbar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              className="search-input"
            />
          </div>
          <div className="toolbar-actions">
            <button className="btn-secondary">Filter</button>
            <button className="btn-secondary">Export</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Added On</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={6}>Loading users...</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar">
                          {user.firstName.charAt(0)}
                        </div>
                        <span className="user-name">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="td-email">{user.email}</td>
                    <td>
                      <span className="badge badge-neutral">
                        {user.roles[0]?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${user.status === 'active' ? 'success' : 'warning'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="td-date">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="td-actions">
                      <button className="btn-icon">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && users.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={6}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
