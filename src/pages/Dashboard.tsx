import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/shared/StatusBadge';
import { formatRelativeTime, formatDashboardDateTime } from '../utils/timeFormat';
import {
  ClipboardList, UserCheck, Clock, AlertCircle, CheckCircle2, PlusCircle, Users, HandMetal, AlertTriangle, FolderOpen,
  Briefcase, BarChart3, ArrowRight, ShieldAlert, Timer, XCircle, Copy, Inbox
} from 'lucide-react';

interface Stats {
  total: number;
  unassigned: number;
  escalated: number;
  inProgress: number;
  pendingInfo: number;
  completed: number;
  new: number;
}

export default function Dashboard() {
  useEffect(() => { document.title = 'Dashboard — DIX Portal'; }, []);
  const { isAdmin, isGuest, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ total: 0, unassigned: 0, escalated: 0, inProgress: 0, pendingInfo: 0, completed: 0, new: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [unassignedRequests, setUnassignedRequests] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState({ total: 0, active: 0, planning: 0, completed: 0, delayed: 0 });
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myStats, setMyStats] = useState({ assigned: 0, active: 0, overdue: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState(formatDashboardDateTime());

  // Live clock update every 30s
  useEffect(() => {
    const interval = setInterval(() => setDateTime(formatDashboardDateTime()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashData, staffData] = await Promise.all([
        api.requests.dashboard(),
        api.users.all(),
      ]);
      setStats(dashData.stats);
      setRecentRequests(dashData.recentRequests);
      setUnassignedRequests(dashData.unassignedRequests);
      setProjectStats(dashData.projectStats);
      setMyRequests(dashData.myRequests || []);
      setMyStats(dashData.myStats || { assigned: 0, active: 0, overdue: 0, completed: 0 });
      setStaffList(staffData.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (requestId: number, userId: string) => {
    try {
      await api.requests.update(requestId, { assigned_to: userId, status: 'New' });
      toast.success('Assigned successfully');
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to assign');
    }
  };

  const handleClaim = async (requestId: number) => {
    try {
      await api.requests.claim(requestId);
      toast.success('Job claimed! It\'s now assigned to you.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim job');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const roleLabel = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'guest' ? 'Guest' : 'Staff';

  // Secondary info cards — calm, informational
  const secondaryCards = [
    { label: 'Total Requests', value: stats.total, icon: ClipboardList, accent: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400', filter: '' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, accent: 'text-primary-500 bg-primary-50 dark:bg-primary-500/15 dark:text-primary-400', filter: 'status=In+Progress' },
    { label: 'Pending Info', value: stats.pendingInfo, icon: AlertCircle, accent: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-400', filter: 'status=Pending+Info' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, accent: 'text-green-600 bg-green-50 dark:bg-green-500/15 dark:text-green-400', filter: 'status=Completed' },
  ];

  // Action-required cards — more prominent
  const actionCards = [
    { label: 'New', value: stats.new, icon: PlusCircle, accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-400', filter: 'status=New' },
    { label: 'Unassigned', value: stats.unassigned, icon: UserCheck, accent: 'text-orange-600 bg-orange-50 dark:bg-orange-500/15 dark:text-orange-400', filter: 'unassigned=true', priority: true },
    { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, accent: 'text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-400', filter: 'unassigned=true', priority: true },
  ];

  const projectCards = [
    { label: 'Active Projects', value: projectStats.active, icon: Timer, accent: 'text-primary-600 bg-primary-50 dark:bg-primary-500/15 dark:text-primary-400', filter: 'status=Active' },
    { label: 'Delayed', value: projectStats.delayed, icon: XCircle, accent: 'text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-400', filter: '' },
    { label: 'Completed', value: projectStats.completed, icon: CheckCircle2, accent: 'text-green-600 bg-green-50 dark:bg-green-500/15 dark:text-green-400', filter: 'status=Completed' },
  ];

  return (
    <div className="space-y-8">
      {/* Header — Identity + Date/Time */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back, {profile?.name || 'User'}
          </h1>
          <div className="flex items-center gap-3">
            {profile?.department && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{profile.department}</p>
            )}
            <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {roleLabel}
            </span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2">
          <button
            onClick={() => navigate('/insights')}
            className="flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <BarChart3 size={14} />
            Insights & Reports
          </button>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{dateTime}</p>
        </div>
      </div>

      {/* Section A — Overview Stats (secondary, calm) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {secondaryCards.map((card) => (
          <div key={card.label} onClick={() => navigate(`/requests?${card.filter}`)} className="group glass-card p-4 cursor-pointer transition-all duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${card.accent} rounded-xl flex items-center justify-center transition-colors duration-150`}>
                <card.icon size={19} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Section B — Action Required (more prominent) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actionCards.map((card) => (
          <div key={card.label} onClick={() => navigate(`/requests?${card.filter}`)} className={`group glass-card p-4 cursor-pointer transition-all duration-150 ${card.priority && card.value > 0 ? 'ring-1 ring-orange-200 dark:ring-orange-800/40' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${card.accent} rounded-xl flex items-center justify-center transition-colors duration-150`}>
                <card.icon size={19} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Section C — My Workload (prominent for staff users) */}
      {!isGuest && myStats.assigned >= 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-primary-500" /> My Workload
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div onClick={() => navigate('/requests?mine=true')} className="glass-card p-4 cursor-pointer transition-all duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-500/15 rounded-xl flex items-center justify-center">
                  <ClipboardList className="text-primary-600 dark:text-primary-400" size={19} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Assigned</p>
              </div>
              <p className="text-2xl font-bold text-primary-600">{myStats.assigned}</p>
            </div>
            <div onClick={() => navigate('/requests?mine=true&status=In+Progress')} className="glass-card p-4 cursor-pointer transition-all duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <Clock className="text-amber-600 dark:text-amber-400" size={19} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              </div>
              <p className="text-2xl font-bold text-amber-600">{myStats.active}</p>
            </div>
            <div onClick={() => navigate('/requests?mine=true&slaStatus=Overdue')} className={`glass-card p-4 cursor-pointer transition-all duration-150 ${myStats.overdue > 0 ? 'ring-1 ring-red-200 dark:ring-red-800/40' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-500/15 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="text-red-600 dark:text-red-400" size={19} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{myStats.overdue}</p>
            </div>
            <div onClick={() => navigate('/requests?mine=true&status=Completed')} className="glass-card p-4 cursor-pointer transition-all duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-500/15 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="text-green-600 dark:text-green-400" size={19} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{myStats.completed}</p>
            </div>
          </div>
          <div className="glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">My Active Requests</h3>
              <button onClick={() => navigate('/requests?mine=true')} className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors duration-150">View All →</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {myRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No active requests assigned to you</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">You're clear for now.</p>
                </div>
              ) : (
                myRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors duration-150"
                    onClick={() => navigate(`/requests/${req.id}`)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{req.request_id}</p>
                          {req.sla_status === 'Overdue' && (
                            <span className="text-[11px] px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg font-semibold">Overdue</span>
                          )}
                          {req.sla_status === 'Approaching SLA' && (
                            <span className="text-[11px] px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg font-semibold">Due Soon</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{req.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{req.requester_name} · {req.department}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge status={req.status} />
                        <span className={`text-[11px] px-2 py-0.5 rounded-lg font-semibold ${
                          req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                        }`}>{req.urgency}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section D — Unassigned Requests + Recently Updated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Requests */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users size={18} className="text-orange-500" />
              {isAdmin ? 'Unassigned Requests' : isGuest ? 'Unassigned Requests' : 'Available Jobs'}
            </h2>
            <span className="status-unassigned px-2.5 py-1 rounded-lg text-[11px] font-semibold">{unassignedRequests.length}</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {unassignedRequests.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No unassigned requests</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">All incoming requests have been reviewed.</p>
              </div>
            ) : (
              unassignedRequests.map((req: any) => {
                const isEscalated = req.days_unassigned >= 3;
                return (
                  <div key={req.id} className={`rounded-xl p-3.5 border transition-colors duration-150 ${isEscalated ? 'bg-red-50/60 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-gray-800/50'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{req.request_id}</p>
                          {isEscalated && (
                            <span className="flex items-center gap-1 text-[11px] text-red-600 font-semibold">
                              <AlertTriangle size={11} /> {req.days_unassigned}d unassigned
                            </span>
                          )}
                          {req.possible_duplicate_of && (
                            <span className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-lg">
                              <Copy size={10} /> Follow-up of {req.possible_duplicate_of}
                            </span>
                          )}
                          {req.remarks && req.remarks.includes('thread reply') && (
                            <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">
                              Email Reply
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{req.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{req.requester_name} · {req.department}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-lg font-semibold flex-shrink-0 ${
                        req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                      }`}>{req.urgency}</span>
                    </div>
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <select
                          className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors duration-150"
                          onChange={(e) => {
                            if (e.target.value) handleAssign(req.id, e.target.value);
                          }}
                          defaultValue=""
                        >
                          <option value="">Assign to...</option>
                          {staffList.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                          ))}
                        </select>
                      </div>
                    ) : !isGuest ? (
                      <button
                        onClick={() => handleClaim(req.id)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-150"
                      >
                        <HandMetal size={14} /> Claim This Job
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recently Updated */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recently Updated</h2>
            <button onClick={() => navigate('/requests')} className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors duration-150">View All →</button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No recent activity</p>
              </div>
            ) : (
              recentRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors duration-150 border-b border-gray-50 dark:border-gray-800/30 last:border-0"
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mb-0.5">{req.request_id}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{req.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {req.assigned_name || 'Unassigned'}
                      {req.updated_at && <span> · {formatRelativeTime(req.updated_at)}</span>}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section E — Compact Project Summary */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FolderOpen size={18} className="text-purple-500" />
            Projects
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-150"
          >
            View Projects <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {projectCards.map((card) => (
            <div key={card.label} onClick={() => navigate(`/projects?${card.filter}`)} className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 ${card.accent} rounded-xl flex items-center justify-center`}>
                  <card.icon size={19} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
