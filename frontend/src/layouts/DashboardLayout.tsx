import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
  LayoutDashboard, Users, Building2, Briefcase, UserPlus,
  Clock, Calendar, LayoutTemplate, DollarSign,
  Mic, Search, FileText, ChevronDown, UserCircle,
  MonitorSmartphone, CreditCard, Bot, LifeBuoy, Map, LogOut, Settings, X, ArrowLeft, LayoutGrid, Bell, CheckSquare, Target, Users2, BarChart3, HelpCircle, Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { employeeService } from '../services/employee.service';
import './Layout.css';

interface NavItem {
  path: string;
  label: string;
  icon: any;
  group?: string;
  subItems?: { path: string; label: string; }[];
}

export function DashboardLayout() {
  const { user, activeContext, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem(`profilePhoto_${user?.id}`) || '');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Replace these with your actual Cloudinary details or use env vars
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.secure_url) {
        setAvatarUrl(data.secure_url);
        localStorage.setItem(`profilePhoto_${user?.id}`, data.secure_url);
      } else {
        alert('Upload failed: ' + (data.error?.message || 'Unknown error. Make sure Cloudinary env vars are set.'));
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed. Check console.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const orgId = user?.organizationId || user?.tenantId;
        if (orgId) {
          const data = await employeeService.getEmployees(orgId);
          setEmployees(data || []);
        }
      } catch (err) {
        console.error("Error fetching employees for search:", err);
      }
    };
    fetchEmployees();
  }, [user?.organizationId, user?.tenantId]);

  // Close profile dropdown when clicking outside
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasPermission = (code: string) => {
    if (user?.roles?.includes('tenant_admin') || user?.roles?.includes('super_admin')) return true;
    return user?.permissions?.includes(code);
  };

  const getOrganizationNav = (): NavItem[] => {
    const items: NavItem[] = [];
    items.push({ path: '/organization/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' });

    if (hasPermission('employee.record:read')) {
      items.push({ path: '/organization/employees', label: 'Employees', icon: Users, group: 'People Management' });
      items.push({ path: '/organization/departments', label: 'Departments', icon: Building2, group: 'People Management' });
    }

    if (hasPermission('recruitment.dashboard.read') || hasPermission('recruitment.job.read')) {
      items.push({ path: '/organization/recruitment', label: 'Recruitment', icon: Briefcase, group: 'Recruitment' });
    }

    if (hasPermission('onboarding.dashboard.read') || hasPermission('employee.record:read')) {
      items.push({ path: '/organization/onboarding', label: 'Onboarding', icon: UserPlus, group: 'Recruitment' });
    }

    if (hasPermission('attendance.dashboard.read') || hasPermission('attendance.record:read')) {
      items.push({ path: '/organization/attendance', label: 'Attendance', icon: Clock, group: 'People Management' });
    }

    if (hasPermission('leave.dashboard.read') || hasPermission('leave.request:read')) {
      items.push({ path: '/organization/leaves', label: 'Leave Management', icon: Calendar, group: 'People Management' });
    }

    if (hasPermission('project.dashboard.read') || hasPermission('project.record:read')) {
      items.push({ path: '/organization/projects', label: 'Projects & Tasks', icon: LayoutTemplate, group: 'Projects and Work' });
    }

    if (hasPermission('payroll.dashboard.read') || hasPermission('payroll.run:calculate')) {
      items.push({ path: '/organization/payroll', label: 'Payroll Runs', icon: DollarSign, group: 'Payroll and Finance' });
    }

    // Phase 6: AI Voice Agent
    items.push({ path: '/organization/voice-agent', label: 'AI Voice Agent', icon: Mic, group: 'AI and Communication' });

    // Administration
    items.push({ path: '/organization/setup', label: 'Organization Profile', icon: Building2, group: 'Administration' });

    return items;
  };

  const getEmployeeNav = (): NavItem[] => {
    return [
      { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      {
        path: '#',
        label: 'My Work',
        icon: Briefcase,
        subItems: [
          { path: '/employee/work/tasks', label: 'My Tasks' },
          { path: '/employee/work/projects', label: 'Projects' },
          { path: '/employee/work/timesheets', label: 'Timesheets' }
        ]
      },
      {
        path: '#',
        label: 'Attendance',
        icon: Clock,
        subItems: [
          { path: '/employee/attendance/my', label: 'My Attendance' },
          { path: '/employee/attendance/corrections', label: 'Attendance Corrections' },
          { path: '/employee/attendance/history', label: 'Attendance History' },
          { path: '/employee/attendance/shifts', label: 'Shift Schedule' }
        ]
      },
      {
        path: '#',
        label: 'Leave',
        icon: Calendar,
        subItems: [
          { path: '/employee/leave/apply', label: 'Apply Leave' },
          { path: '/employee/leave/requests', label: 'My Leave Requests' },
          { path: '/employee/leave/balance', label: 'Leave Balance' },
          { path: '/employee/leave/team', label: 'Team Calendar' }
        ]
      },
      {
        path: '#',
        label: 'Payroll',
        icon: DollarSign,
        subItems: [
          { path: '/employee/payroll/payslips', label: 'Payslips' },
          { path: '/employee/payroll/structure', label: 'Salary Structure' },
          { path: '/employee/payroll/tax', label: 'Tax Documents' },
          { path: '/employee/payroll/reimbursements', label: 'Reimbursements' }
        ]
      },
      {
        path: '#',
        label: 'My Profile',
        icon: UserCircle,
        subItems: [
          { path: '/employee/profile', label: 'Personal Information' },
          { path: '/employee/profile/job', label: 'Job Information' },
          { path: '/employee/profile/documents', label: 'Documents' },
          { path: '/employee/profile/bank', label: 'Bank Details' },
          { path: '/employee/profile/emergency', label: 'Emergency Contacts' },
          { path: '/employee/profile/education', label: 'Education' },
          { path: '/employee/profile/experience', label: 'Experience' },
          { path: '/employee/profile/skills', label: 'Skills' },
          { path: '/employee/profile/certifications', label: 'Certifications' }
        ]
      },
      {
        path: '#',
        label: 'Assets',
        icon: MonitorSmartphone,
        subItems: [
          { path: '/employee/assets/my', label: 'My Assets' },
          { path: '/employee/assets/requests', label: 'Asset Requests' }
        ]
      },
      {
        path: '#',
        label: 'Expenses',
        icon: CreditCard,
        subItems: [
          { path: '/employee/expenses/claim', label: 'Claim Expense' },
          { path: '/employee/expenses/history', label: 'Expense History' }
        ]
      },
      {
        path: '#',
        label: 'AI Assistant',
        icon: Bot,
        subItems: [
          { path: '/employee/ai/voice', label: 'AI Voice Agent' },
          { path: '/employee/ai/hr', label: 'HR Assistant' }
        ]
      },
      {
        path: '#',
        label: 'Help',
        icon: LifeBuoy,
        subItems: [
          { path: '/employee/help/tickets', label: 'Support Tickets' },
          { path: '/employee/help/policies', label: 'Company Policies' },
          { path: '/employee/help/knowledge', label: 'Knowledge Base' }
        ]
      },
    ];
  };

  const getManagerNav = (): NavItem[] => {
    return [
      { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      {
        path: '#',
        label: 'Team Management',
        icon: Users2,
        subItems: [
          { path: '/employee/manager/team', label: 'My Team' },
          { path: '/employee/manager/directory', label: 'Team Directory' },
          { path: '/employee/manager/org-chart', label: 'Organization Chart' }
        ]
      },
      {
        path: '#',
        label: 'My Work',
        icon: Briefcase,
        subItems: [
          { path: '/employee/work/tasks', label: 'My Tasks' },
          { path: '/employee/manager/team-tasks', label: 'Team Tasks' },
          { path: '/employee/work/projects', label: 'Projects' },
          { path: '/employee/work/calendar', label: 'Calendar' },
          { path: '/employee/work/timesheets', label: 'Timesheets' }
        ]
      },
      {
        path: '#',
        label: 'Team Attendance',
        icon: Clock,
        subItems: [
          { path: '/employee/manager/attendance', label: 'Team Attendance' },
          { path: '/employee/manager/attendance-corrections', label: 'Attendance Corrections' }
        ]
      },
      {
        path: '#',
        label: 'Payroll',
        icon: DollarSign,
        subItems: [
          { path: '/employee/manager/payroll', label: 'Payroll Summary' },
          { path: '/employee/manager/reimbursements', label: 'Approve Reimbursements' }
        ]
      },
      {
        path: '#',
        label: 'Leave',
        icon: Calendar,
        subItems: [
          { path: '/employee/manager/leave-requests', label: 'Leave Requests' },
          { path: '/employee/leave/team', label: 'Team Leave Calendar' },
          { path: '/employee/manager/leave-balance', label: 'Leave Balance Report' }
        ]
      },
      {
        path: '#',
        label: 'Performance',
        icon: Target,
        subItems: [
          { path: '/employee/manager/goals', label: 'Team Goals' },
          { path: '/employee/manager/reviews', label: 'Performance Reviews' },
          { path: '/employee/manager/1on1', label: '1-on-1 Meetings' },
          { path: '/employee/manager/feedback', label: 'Feedback' }
        ]
      },
      {
        path: '#',
        label: 'Payroll',
        icon: DollarSign,
        subItems: [
          { path: '/employee/manager/payroll', label: 'Team Payroll Summary' },
          { path: '/employee/payroll/payslips', label: 'Payslips (Self)' }
        ]
      },
      {
        path: '#',
        label: 'Reports & Analytics',
        icon: Target,
        subItems: [
          { path: '/employee/manager/reports/team', label: 'Team Reports' },
          { path: '/employee/manager/reports/attendance', label: 'Attendance Reports' },
          { path: '/employee/manager/reports/leave', label: 'Leave Reports' },
          { path: '/employee/manager/reports/productivity', label: 'Productivity Reports' }
        ]
      },
      {
        path: '#',
        label: 'Recruitment',
        icon: Briefcase,
        subItems: [
          { path: '/employee/manager/interviews', label: 'Interview Schedule' },
          { path: '/employee/manager/candidate-feedback', label: 'Candidate Feedback' },
          { path: '/employee/manager/requisitions', label: 'Job Requisitions' }
        ]
      },
      {
        path: '#',
        label: 'My Profile',
        icon: UserCircle,
        subItems: [
          { path: '/employee/profile', label: 'Personal Information' },
          { path: '/employee/profile/job', label: 'Job Information' },
          { path: '/employee/profile/documents', label: 'Documents' },
          { path: '/employee/profile/bank', label: 'Bank Details' },
          { path: '/employee/profile/emergency', label: 'Emergency Contacts' },
          { path: '/employee/profile/education', label: 'Education' },
          { path: '/employee/profile/experience', label: 'Experience' },
          { path: '/employee/profile/skills', label: 'Skills' },
          { path: '/employee/profile/certifications', label: 'Certifications' }
        ]
      },
      {
        path: '#',
        label: 'Assets',
        icon: MonitorSmartphone,
        subItems: [
          { path: '/employee/assets/my', label: 'My Assets' },
          { path: '/employee/manager/assets', label: 'Team Assets' }
        ]
      },
      {
        path: '#',
        label: 'Expenses',
        icon: CreditCard,
        subItems: [
          { path: '/employee/expenses/claim', label: 'My Claims' },
          { path: '/employee/manager/expenses', label: 'Team Expense Approvals' }
        ]
      },
      {
        path: '#',
        label: 'AI Assistant',
        icon: Bot,
        subItems: [
          { path: '/employee/ai/voice', label: 'AI Voice Agent' },
          { path: '/employee/ai/hr', label: 'HR Assistant' }
        ]
      },
      {
        path: '#',
        label: 'Reports',
        icon: BarChart3,
        subItems: [
          { path: '/employee/manager/reports/team', label: 'Team Reports' },
          { path: '/employee/manager/reports/attendance', label: 'Attendance Reports' },
          { path: '/employee/manager/reports/leave', label: 'Leave Reports' },
          { path: '/employee/manager/reports/productivity', label: 'Productivity Reports' }
        ]
      },
      {
        path: '#',
        label: 'Help',
        icon: HelpCircle,
        subItems: [
          { path: '/employee/help/tickets', label: 'Support' },
          { path: '/employee/help/policies', label: 'Company Policies' }
        ]
      },
    ];
  };

  // Determine the effective context based on URL if it differs from state
  const isManager = user?.roles?.includes('Manager') || user?.roles?.includes('manager');
  const effectiveContext = location.pathname.startsWith('/employee') ? 'employee' : 'organization';

  const navItems = effectiveContext === 'organization' ? getOrganizationNav() : (isManager ? getManagerNav() : getEmployeeNav());

  // Group items
  const groupedNav = navItems.reduce((acc, item) => {
    const group = item.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const handleSwitchWorkspace = async (target: 'organization' | 'employee') => {
    if (target === activeContext) return;
    setSwitching(true);
    try {
      const res = await api.post('/auth/switch-workspace', { targetWorkspace: target });
      const { user: updatedUser, tokens } = res.data.data;
      setAuth(updatedUser, tokens.accessToken, tokens.refreshToken);
      setProfileOpen(false);
      navigate(`/${target}/dashboard`);
    } catch (err: any) {
      console.error('Failed to switch workspace', err);
      alert(err.response?.data?.message || 'Failed to switch workspace');
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const currentWorkspaceName = effectiveContext === 'organization' ? 'Organization Admin' : 'Employee Workspace';

  const getDisplayRole = () => {
    if (user?.roles?.includes('super_admin')) return 'Super Admin';
    if (user?.roles?.includes('tenant_admin')) return 'Organization Admin';
    if (user?.roles?.includes('manager') || user?.roles?.includes('hr_manager')) return 'Manager';
    if (user?.roles?.includes('hr_executive')) return 'HR Executive';
    return 'Employee';
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isAppDrawerOpen ? 'app-drawer-open' : ''}`}>
        {!isAppDrawerOpen ? (
          <>
            <div className="sidebar-header">
              <button
                onClick={() => setIsAppDrawerOpen(true)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <LayoutGrid size={22} />
              </button>
              <div className="app-drawer-search">
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="All Apps"
                  readOnly
                  onClick={() => setIsAppDrawerOpen(true)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <nav className="sidebar-nav custom-scrollbar">
              {Object.entries(groupedNav).map(([group, items]) => (
                <div key={group}>
                  {group !== 'General' && (
                    <div className="nav-group-title">
                      {group}
                    </div>
                  )}
                  <div className="nav-links">
                    {items.map((item) => {
                      const hasSubItems = item.subItems && item.subItems.length > 0;
                      const isExpanded = expandedMenus.includes(item.label);

                      if (hasSubItems) {
                        return (
                          <div key={item.label} className="nav-item-accordion">
                            <div
                              className={`nav-link accordion-header ${isExpanded ? 'expanded' : ''}`}
                              onClick={() => toggleMenu(item.label)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="nav-link-icon">
                                <item.icon size={18} />
                              </div>
                              <span style={{ flex: 1 }}>{item.label}</span>
                              <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }} />
                            </div>
                            {isExpanded && (
                              <div className="accordion-content">
                                {item.subItems!.map(sub => {
                                  const isSubActive = location.pathname.startsWith(sub.path);
                                  return (
                                    <NavLink
                                      key={sub.path}
                                      to={sub.path}
                                      className={`nav-sublink ${isSubActive ? 'active' : ''}`}
                                    >
                                      {sub.label}
                                    </NavLink>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const isActive = location.pathname === item.path || (item.path !== '#' && location.pathname.startsWith(item.path));
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                          <div className="nav-link-icon">
                            <item.icon size={18} />
                          </div>
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Sidebar Footer - Profile */}
            <div className="sidebar-footer" ref={profileRef}>
              <button
                className="sidebar-profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="profile-avatar" style={{ overflow: 'hidden', flexShrink: 0 }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.firstName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="sidebar-profile-info">
                  <div className="sidebar-profile-name">{user?.firstName} {user?.lastName}</div>
                  <div className="sidebar-profile-role">{getDisplayRole()}</div>
                </div>
                <ChevronDown size={14} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'all 0.2s', flexShrink: 0 }} />
              </button>

              {/* Profile Dropdown (opens upward) */}
              {profileOpen && (
                <div className="profile-dropdown-menu sidebar-profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{user?.firstName} {user?.lastName}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>

                  {user?.hasEmployeeProfile && user?.roles?.some(r => r === 'tenant_admin' || r === 'super_admin' || r === 'hr_manager') && (
                    <div className="dropdown-section">
                      <div className="dropdown-section-title">Switch Workspace</div>

                      <button
                        onClick={() => handleSwitchWorkspace('organization')}
                        disabled={switching}
                        className={`dropdown-item ${activeContext === 'organization' ? 'active' : ''}`}
                      >
                        <div className="dropdown-item-content">
                          <Building2 size={16} />
                          Organization Admin
                        </div>
                        {activeContext === 'organization' && <Check size={14} />}
                      </button>

                      <button
                        onClick={() => handleSwitchWorkspace('employee')}
                        disabled={switching}
                        className={`dropdown-item ${activeContext === 'employee' ? 'active' : ''}`}
                        style={{ marginTop: '0.25rem' }}
                      >
                        <div className="dropdown-item-content">
                          <Users size={16} />
                          Employee Self-Service
                        </div>
                        {activeContext === 'employee' && <Check size={14} />}
                      </button>
                    </div>
                  )}

                  <div style={{ padding: '0.5rem' }}>
                    <button
                      onClick={handleLogout}
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
          </>
        ) : (
          <div className="app-drawer">
            <div className="app-drawer-header">
              <button className="app-drawer-back" onClick={() => setIsAppDrawerOpen(false)}>
                <ArrowLeft size={20} />
              </button>
              <div className="app-drawer-search">
                <input type="text" placeholder="All Apps" autoFocus />
                <Search size={14} color="#94a3b8" />
              </div>
            </div>
            <div className="app-drawer-content custom-scrollbar">
              {/* Recent Apps */}
              <h3 className="app-section-title">Recent Apps</h3>
              <div className="app-grid">
                {navItems.slice(0, 4).map(item => (
                  <NavLink
                    key={`recent-${item.path}`}
                    to={item.path}
                    className="app-item"
                    onClick={() => setIsAppDrawerOpen(false)}
                  >
                    <div className="app-icon-wrapper">
                      <item.icon size={24} />
                    </div>
                    <span className="app-item-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* All Apps */}
              <h3 className="app-section-title">All Apps</h3>
              <div className="app-grid">
                {navItems.map(item => (
                  <NavLink
                    key={`all-${item.path}`}
                    to={item.path}
                    className="app-item"
                    onClick={() => setIsAppDrawerOpen(false)}
                  >
                    <div className="app-icon-wrapper">
                      <item.icon size={24} />
                    </div>
                    <span className="app-item-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header - Simplified (profile moved to sidebar) */}
        <header className="topbar">
        </header>

        {/* Page Content */}
        <div className="page-container custom-scrollbar">
          <div className="page-content">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Profile Settings</h2>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f1f5f9', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', color: '#94a3b8' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.firstName?.charAt(0) || 'U'
                )}
              </div>

              <label style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '0.875rem', fontWeight: 500 }}>
                {uploadingAvatar ? 'Uploading to Cloudinary...' : 'Change Photo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>First Name</label>
                <input type="text" value={user?.firstName || ''} readOnly style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Last Name</label>
                <input type="text" value={user?.lastName || ''} readOnly style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Email</label>
                <input type="text" value={user?.email || ''} readOnly style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} />
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem', textAlign: 'center' }}>
              Contact HR to update personal details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
