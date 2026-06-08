import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, ClipboardList, Activity, LogOut, Shield, X, FolderOpen } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: ClipboardList, label: 'Job Requests' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/users', icon: Users, label: 'User Management', adminOnly: true },
  { to: '/activities', icon: Activity, label: 'Activity Logs' },
];

export default function Sidebar({ onClose }: { onClose: () => void }) {
  const { profile, logout, isAdmin, isGuest } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-full glass-dark flex flex-col m-2 mr-0 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-sm">DIX Portal</h2>
            <p className="text-xs text-gray-500">Job Management</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/50 rounded-lg">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                }`
              }>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-200/50 pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{profile?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{profile?.name || 'Loading...'}</p>
            {isGuest ? (
              <p className="text-xs text-amber-600 font-semibold">👁 Guest Mode (Read-Only)</p>
            ) : (
              <p className="text-xs text-gray-500 capitalize">{profile?.role || ''}</p>
            )}
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
