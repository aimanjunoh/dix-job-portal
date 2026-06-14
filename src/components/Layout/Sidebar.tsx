import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, ClipboardList, Activity, LogOut, X, FolderOpen, BarChart3 } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import { useTheme } from '../shared/ThemeToggle';

const mainNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: ClipboardList, label: 'Job Requests' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
];

const analyticsNavItems = [
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/activities', icon: Activity, label: 'Activity Logs' },
];

const adminNavItems = [
  { to: '/users', icon: Users, label: 'User Management' },
];

function NavItem({ item, onClose }: { item: { to: string; icon: any; label: string }; onClose: () => void }) {
  return (
    <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-gray-300'
        }`
      }>
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-full" />}
          <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onClose }: { onClose: () => void }) {
  const { profile, logout, isAdmin, isGuest } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const avatarRing = isAdmin ? 'ring-2 ring-primary-400' : isGuest ? 'ring-2 ring-amber-400' : 'ring-2 ring-primary-300';

  return (
    <div className="h-full flex flex-col m-2 mr-0 p-5 bg-white dark:bg-[#13131f] border border-gray-100 dark:border-gray-800/60 rounded-2xl shadow-sm">
      {/* Brand */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <img src="/dix-logo.svg" alt="DIX" className="h-11 w-auto object-contain" />
            <div className="mt-3">
              <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 leading-tight">DIX Portal</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Digital Innovation</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors duration-150">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-7">
        {/* Main */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Main</p>
          <div className="space-y-0.5">
            {mainNavItems.map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </div>
        </div>

        {/* Analytics */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Analytics</p>
          <div className="space-y-0.5">
            {analyticsNavItems.map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </div>
        </div>

        {/* Admin */}
        {isAdmin && (
          <div>
            <div className="border-t border-gray-100 dark:border-gray-800/60 mb-5" />
            <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Administration</p>
            <div className="space-y-0.5">
              {adminNavItems.map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-100 dark:border-gray-800/60 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className={`w-9 h-9 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center ${avatarRing} flex-shrink-0`}>
            <span className="text-primary-600 dark:text-primary-400 text-xs font-bold">{profile?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{profile?.name || 'Loading...'}</p>
            {isGuest ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Guest Mode</p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{profile?.role || ''}</p>
            )}
          </div>
          <ThemeToggle dark={dark} onToggle={toggle} />
          <button onClick={handleLogout} aria-label="Logout" className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors duration-150" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
