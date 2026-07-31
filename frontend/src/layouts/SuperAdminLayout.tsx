import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { 
  Building2, 
  LogOut,
  Settings,
  LayoutDashboard,
  ShieldAlert,
  CreditCard,
  Activity,
  LifeBuoy,
  Search,
  Bell,
  RefreshCw,
  ServerCrash,
  ChevronDown,
  User,
  Menu
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import './Layout.css';

const superAdminNavItems = [
  { path: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/superadmin/organizations', label: 'Organizations', icon: Building2 },
  { path: '/superadmin/plans', label: 'Subscription Plans', icon: CreditCard },
  { path: '/superadmin/usage', label: 'Platform Usage', icon: Activity },
  { path: '/superadmin/health', label: 'System Health', icon: ServerCrash },
  { path: '/superadmin/jobs', label: 'Background Jobs', icon: RefreshCw },
  { path: '/superadmin/tickets', label: 'Support Tickets', icon: LifeBuoy },
  { path: '/superadmin/audit', label: 'Audit Logs', icon: ShieldAlert },
];

export function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you really want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <ShieldAlert className="text-brand-500" size={24} />
          {isSidebarOpen && <span className="font-bold text-lg" style={{ color: 'white' }}>PeopleFlow <span className="text-brand-500 text-xs ml-1 font-bold">PLATFORM</span></span>}
        </div>

        <nav className="sidebar-nav">
          {superAdminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/superadmin');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon size={20} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          {/* Middle section: Search Bar centered */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="premium-search-bar hidden md:flex">
              <input type="text" placeholder="Search anything" className="premium-search-input" />
              <div className="premium-search-actions">
                <Search size={18} className="premium-search-icon" style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </div>
          
          {/* Right section: Actions */}
          <div className="topbar-actions" style={{ width: '200px', justifyContent: 'flex-end' }}>
            <button style={{ position: 'relative', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }} className="hidden sm:block">
              <Bell size={20} className="text-secondary" />
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-color)' }}></span>
            </button>
            
            <div className="topbar-divider hidden sm:block"></div>

            <div className="profile-menu">
              <div 
                className="profile-trigger"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                title="Profile Menu"
              >
                <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                  SA
                </div>
              </div>
              
              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="dropdown-menu">
                   <div className="dropdown-header">
                     <div className="dropdown-name">Super Administrator</div>
                     <div className="dropdown-email">{user?.email || 'admin@peopleflow.com'}</div>
                   </div>
                   
                   <div style={{ padding: '0.5rem' }}>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                      }}
                    >
                      <div className="dropdown-item-content">
                        <User size={16} color="var(--text-muted)" />
                        Edit Profile
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="dropdown-item dropdown-item-danger"
                      style={{ marginTop: '0.25rem' }}
                    >
                      <div className="dropdown-item-content">
                        <LogOut size={16} />
                        Sign out
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-container custom-scrollbar">
          <div className="page-content">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
