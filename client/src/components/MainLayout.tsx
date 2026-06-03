import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Box, ShieldAlert, Award, FileText, Briefcase, 
  Settings, LogOut, Bell, Search, Menu, X, CheckSquare, 
  MapPin, HelpCircle, User, Calendar
} from 'lucide-react';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<any>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/system/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch branding settings
  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/system/settings');
      setSettings(res.data);
      if (res.data.themeColor) {
        const styleId = 'dynamic-brand-styles';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        const color = res.data.themeColor;
        styleEl.innerHTML = `
          .bg-brand-500 { background-color: ${color} !important; }
          .hover\\:bg-brand-600:hover { background-color: ${color}d0 !important; }
          .text-brand-600 { color: ${color} !important; }
          .text-brand-700 { color: ${color}e0 !important; }
          .text-brand-800 { color: ${color} !important; }
          .text-brand-500 { color: ${color} !important; }
          .border-brand-500 { border-color: ${color} !important; }
          .bg-brand-50\\/20 { background-color: ${color}10 !important; }
        `;
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchSettings();
      const interval = setInterval(fetchNotifications, 30000); // 30s polling
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/api/system/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Assets Register', path: '/assets', icon: Box, permission: 'assets:read' },
    { name: 'Maintenance Log', path: '/maintenance', icon: CheckSquare, permission: 'maintenance:read' },
    { name: 'Contracts', path: '/contracts', icon: FileText, permission: 'contracts:read' },
    { name: 'Projects & Grants', path: '/projects', icon: Award, permission: 'projects:read' },
    { name: 'Vendors DB', path: '/vendors', icon: Briefcase, permission: 'vendors:read' },
    { name: 'Reporting Panel', path: '/reports', icon: FileText, permission: 'reports:read' },
    { name: 'Documents Manager', path: '/documents', icon: FileText, permission: null },
    { name: 'System Audit Logs', path: '/audit-logs', icon: ShieldAlert, permission: 'audit:read' },
    { name: 'System Configuration', path: '/administration', icon: Settings, permission: 'settings:write' },
  ];

  const currentPath = location.pathname;

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 font-sans">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0">
        
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={settings?.logoUrl || '/logo.png'} alt="Branding Logo" className="h-8 w-auto bg-white/10 p-0.5 rounded" />
            <span className="text-xl font-bold tracking-tight text-white">
              {settings?.systemName || 'PACT360'}
            </span>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.path);
            
            // Check RBAC permission (Super Admin bypasses all checks)
            if (item.permission && user?.role !== 'Super Admin' && !user?.permissions.includes(item.permission)) {
              return null;
            }

            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/40 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold shadow-inner">
              {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-800 hover:bg-red-900/60 hover:text-white text-xs font-semibold rounded-lg text-slate-350 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="bg-brand-500 text-white border-b border-black/10 h-16 flex items-center justify-between px-6 flex-shrink-0 z-40">
          
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-white/80 hover:text-white focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="text-sm text-white/70 font-medium hidden sm:flex items-center gap-2">
              <span>{settings?.orgName || 'Plan International Liberia'}</span>
              <span className="text-white/40">/</span>
              <span className="text-white font-bold capitalize">
                {currentPath.split('/')[1] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Real Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-brand-500 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden text-slate-800">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">System Alerts</span>
                    <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-semibold">{unreadCount} New</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No active alerts.</div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`p-3.5 hover:bg-slate-50 transition-all cursor-pointer flex flex-col gap-1 ${!n.isRead ? 'bg-brand-50/20' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-xs font-semibold ${!n.isRead ? 'text-brand-700' : 'text-slate-600'}`}>{n.title}</span>
                            <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button 
                      onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User details summary */}
            <div 
              onClick={() => navigate('/profile')} 
              className="flex items-center gap-2 cursor-pointer border-l border-white/20 pl-4 py-1"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-semibold text-sm border border-white/10 hover:bg-white/20 transition-colors">
                {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white leading-none">{user?.firstName} {user?.lastName}</div>
                <div className="text-[10px] text-white/70 font-medium mt-0.5">{user?.role}</div>
              </div>
            </div>

          </div>

        </header>

        {/* Scrollable Worksite Canvas */}
        <main className="flex-1 overflow-y-auto p-6 z-10">
          <div className="max-w-7xl mx-auto h-full animate-fade-in">
            {children}
          </div>
        </main>

      </div>

      {/* Mobile Drawer (Overlay Side Navigation Menu) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-64 bg-slate-900 text-slate-300 flex flex-col p-6 border-r border-slate-800 animate-fade-in h-full">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-8">
              <img src={settings?.logoUrl || '/logo.png'} alt="Branding Logo" className="h-8 w-auto" />
              <span className="text-lg font-bold text-white">{settings?.systemName || 'PACT360'}</span>
            </div>
            <nav className="flex-1 space-y-1">
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentPath.startsWith(item.path);

                if (item.permission && user?.role !== 'Super Admin' && !user?.permissions.includes(item.permission)) {
                  return null;
                }

                return (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive 
                        ? 'bg-brand-500 text-white' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-3">
              <p className="text-xs text-slate-400">{user?.firstName} {user?.lastName}</p>
              <button 
                onClick={handleLogout}
                className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
