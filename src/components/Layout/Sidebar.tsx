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
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-white/20 text-white backdrop-blur-sm'
            : 'text-gray-500 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white'
        }`
      }>
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-full" />}
          <item.icon size={18} />
          {item.label}
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

  const avatarRing = isAdmin ? 'ring-2 ring-indigo-400' : isGuest ? 'ring-2 ring-amber-400' : 'ring-2 ring-primary-400';

  return (
    <div className="h-full glass-dark flex flex-col m-2 mr-0 p-4">
      {/* Brand */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="/dix-logo.png" alt="DIX" className="h-8 object-contain" />
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/50 dark:hover:bg-white/20 rounded-lg">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5">
        {/* Main */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Main</p>
          <div className="space-y-1">
            {mainNavItems.map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </div>
        </div>

        {/* Analytics */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Analytics</p>
          <div className="space-y-1">
            {analyticsNavItems.map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
          </div>
        </div>

        {/* Admin */}
        {isAdmin && (
          <div>
            <div className="border-t border-gray-200/30 dark:border-gray-600/30 mb-3" />
            <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Administration</p>
            <div className="space-y-1">
              {adminNavItems.map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200/50 dark:border-gray-600/30 pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className={`w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center ${avatarRing}`}>
            <span className="text-white text-xs font-bold">{profile?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{profile?.name || 'Loading...'}</p>
            {isGuest ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Guest Mode (Read-Only)</p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile?.role || ''}</p>
            )}
          </div>
          <ThemeToggle dark={dark} onToggle={toggle} />
          <button onClick={handleLogout} aria-label="Logout" className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
