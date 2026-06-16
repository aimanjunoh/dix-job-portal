import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/shared/StatusBadge';
import { formatRelativeTime, formatDashboardDateTime } from '../utils/timeFormat';
import {
  ClipboardList, UserCheck, Clock, AlertCircle, CheckCircle2, PlusCircle, Users, HandMetal, AlertTriangle, FolderOpen,
  Briefcase, BarChart3, ArrowRight, ShieldAlert, Timer, XCircle, Copy, Inbox, LucideIcon, Shield
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

interface KpiCard {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  filter: string;
  isAction?: boolean;
  priority?: boolean;
}

function KpiCardCell({ card, onClick }: { card: KpiCard; onClick: () => void }) {
  const isZero = card.value === 0;
  const numberColor = isZero
    ? 'text-gray-300 dark:text-gray-600'
    : card.isAction
      ? 'text-gray-900 dark:text-gray-100'
      : 'text-gray-900 dark:text-gray-100';

  const iconOpacity = isZero ? 'opacity-40' : '';
  const showRing = card.priority && card.value > 0;

  return (
    <div
      onClick={onClick}
      className={`group glass-card px-3 py-2.5 sm:p-4 cursor-pointer transition-all duration-150 ${showRing ? 'ring-1 ring-orange-200/70 dark:ring-orange-800/30' : ''}`}
    >
      <div className={`flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 ${iconOpacity}`}>
        <div className={`w-6 h-6 sm:w-7 sm:h-7 ${card.accent} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <card.icon size={13} className="sm:hidden" />
          <card.icon size={14} className="hidden sm:block" />
        </div>
        <p className="text-[11px] sm:text-[12px] font-medium text-gray-500 dark:text-gray-400 leading-none">{card.label}</p>
      </div>
      <p className={`text-[22px] sm:text-[26px] font-bold leading-none tracking-tight ${numberColor}`}>{card.value}</p>
    </div>
  );
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
  const [slaStats, setSlaStats] = useState({ withinSLA: 0, approachingSLA: 0, overdueSLA: 0, paused: 0, compliance: 100 });
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState(formatDashboardDateTime());

  useEffect(() => {
    const interval = setInterval(() => setDateTime(formatDashboardDateTime()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { loadData(); }, []);

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
      setSlaStats(dashData.slaStats || { withinSLA: 0, approachingSLA: 0, overdueSLA: 0, paused: 0, compliance: 100 });
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
  const displayName = profile?.name ? profile.name.split(' ')[0] : 'User';
  const roleBadgeClass = profile?.role === 'admin'
    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20'
    : profile?.role === 'guest'
      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/40'
      : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20';

  // Secondary info cards — calm, informational
  const secondaryCards: KpiCard[] = [
    { label: 'Total Requests', value: stats.total, icon: ClipboardList, accent: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400', filter: '' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, accent: 'text-primary-500 bg-primary-50 dark:bg-primary-500/15 dark:text-primary-400', filter: 'status=In+Progress' },
    { label: 'Pending Info', value: stats.pendingInfo, icon: AlertCircle, accent: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-400', filter: 'status=Pending+Info' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, accent: 'text-green-600 bg-green-50 dark:bg-green-500/15 dark:text-green-400', filter: 'status=Completed' },
  ];

  // Action-required cards — slightly more emphasis
  const actionCards: KpiCard[] = [
    { label: 'New', value: stats.new, icon: PlusCircle, accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-400', filter: 'status=New', isAction: true },
    { label: 'Unassigned', value: stats.unassigned, icon: UserCheck, accent: 'text-orange-600 bg-orange-50 dark:bg-orange-500/15 dark:text-orange-400', filter: 'unassigned=true', isAction: true, priority: true },
    { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, accent: 'text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-400', filter: 'unassigned=true', isAction: true, priority: true },
  ];

  const workloadCards: KpiCard[] = [
    { label: 'Total Assigned', value: myStats.assigned, icon: ClipboardList, accent: 'text-primary-600 bg-primary-50 dark:bg-primary-500/15 dark:text-primary-400', filter: 'mine=true' },
    { label: 'Active', value: myStats.active, icon: Clock, accent: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-400', filter: 'mine=true&status=In+Progress' },
    { label: 'Overdue', value: myStats.overdue, icon: ShieldAlert, accent: 'text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-400', filter: 'mine=true&slaStatus=Overdue', isAction: true, priority: true },
    { label: 'Completed', value: myStats.completed, icon: CheckCircle2, accent: 'text-green-600 bg-green-50 dark:bg-green-500/15 dark:text-green-400', filter: 'mine=true&status=Completed' },
  ];

  const projectCards: KpiCard[] = [
    { label: 'Active', value: projectStats.active, icon: Timer, accent: 'text-primary-600 bg-primary-50 dark:bg-primary-500/15 dark:text-primary-400', filter: 'status=Active' },
    { label: 'Delayed', value: projectStats.delayed, icon: XCircle, accent: 'text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-400', filter: '', isAction: true, priority: true },
    { label: 'Completed', value: projectStats.completed, icon: CheckCircle2, accent: 'text-green-600 bg-green-50 dark:bg-green-500/15 dark:text-green-400', filter: 'status=Completed' },
  ];

  const slaCards: KpiCard[] = [
    { label: 'Within SLA', value: slaStats.withinSLA, icon: CheckCircle2, accent: 'text-green-600 bg-green-50 dark:bg-green-500/15 dark:text-green-400', filter: 'slaStatus=Within+SLA' },
    { label: 'Approaching', value: slaStats.approachingSLA, icon: Clock, accent: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-400', filter: 'slaStatus=Approaching+SLA' },
    { label: 'Overdue', value: slaStats.overdueSLA, icon: AlertTriangle, accent: 'text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-400', filter: 'slaStatus=Overdue', isAction: true, priority: true },
    { label: 'Paused', value: slaStats.paused, icon: Timer, accent: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400', filter: 'slaStatus=Paused' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
            Welcome back, {displayName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {profile?.department && (
              <p className="text-gray-500 dark:text-gray-400 text-xs">{profile.department}</p>
            )}
            <span className={`inline-flex items-center justify-center h-[22px] text-[11px] font-semibold px-2.5 rounded-full ${roleBadgeClass}`}>
              {roleLabel}
            </span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1.5">
          <button
            onClick={() => navigate('/insights')}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <BarChart3 size={13} />
            Insights & Reports
          </button>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{dateTime}</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {secondaryCards.map((card) => (
          <KpiCardCell key={card.label} card={card} onClick={() => navigate(`/requests?${card.filter}`)} />
        ))}
      </div>

      {/* SLA Overview — event-driven visibility */}
      {(slaStats.approachingSLA > 0 || slaStats.overdueSLA > 0 || slaStats.paused > 0) ? (
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield size={15} className="text-primary-500" /> SLA Overview
            </h2>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {slaStats.compliance}% compliance
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {slaCards.map((card) => (
              <KpiCardCell key={card.label} card={card} onClick={() => navigate(`/requests?${card.filter}`)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-500/[0.06] border border-emerald-200/40 dark:border-emerald-500/10">
          <Shield size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            SLA Overview — {slaStats.compliance}% compliance, no issues
          </p>
        </div>
      )}

      {/* Action Required */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {actionCards.map((card) => (
          <KpiCardCell key={card.label} card={card} onClick={() => navigate(`/requests?${card.filter}`)} />
        ))}
      </div>

      {/* My Workload */}
      {!isGuest && myStats.assigned >= 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase size={15} className="text-primary-500" /> My Workload
            </h2>
            <button onClick={() => navigate('/requests?mine=true')} className="text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors duration-150">View All →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
            {workloadCards.map((card) => (
              <KpiCardCell key={card.label} card={card} onClick={() => navigate(`/requests?${card.filter}`)} />
            ))}
          </div>
        </div>
      )}

      {/* My Active Requests */}
      {!isGuest && (
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">My Active Requests</h3>
            <span className="inline-flex items-center justify-center h-[22px] px-2 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{myRequests.length}</span>
          </div>
          {myRequests.length === 0 ? (
            <div className="flex items-center gap-2.5 py-3 px-3">
              <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <Inbox className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">No active requests assigned to you</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">You're clear for now.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {myRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 py-2 px-2.5 -mx-1 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors duration-150"
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{req.request_id}</p>
                      {req.sla_status === 'Overdue' && (
                        <span className="inline-flex items-center justify-center h-[18px] px-1.5 rounded-full text-[10px] font-semibold urgency-critical">Overdue</span>
                      )}
                      {req.sla_status === 'Approaching SLA' && (
                        <span className="inline-flex items-center justify-center h-[18px] px-1.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">Due Soon</span>
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">{req.title}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{req.requester_name} · {req.department}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center justify-center h-[20px] px-2 rounded-full text-[10px] font-semibold ${
                      req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                    }`}>{req.urgency}</span>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unassigned Requests + Recently Updated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unassigned Requests */}
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users size={15} className="text-orange-500" />
              {isAdmin ? 'Unassigned Requests' : isGuest ? 'Unassigned Requests' : 'Available Jobs'}
            </h2>
            <span className="inline-flex items-center justify-center h-[22px] px-2 rounded-full text-[11px] font-semibold status-unassigned">{unassignedRequests.length}</span>
          </div>
          {unassignedRequests.length === 0 ? (
            <div className="flex items-center gap-2.5 py-3 px-3">
              <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <Inbox className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">No unassigned requests</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">All incoming requests have been reviewed.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {unassignedRequests.map((req: any) => {
                const isEscalated = req.days_unassigned >= 3;
                return (
                  <div key={req.id} className={`rounded-lg p-3 border transition-colors duration-150 ${isEscalated ? 'bg-red-50/60 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-gray-800/50'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{req.request_id}</p>
                          {isEscalated && (
                            <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                              <AlertTriangle size={10} /> {req.days_unassigned}d
                            </span>
                          )}
                          {req.possible_duplicate_of && (
                            <span className="flex items-center gap-0.5 text-[10px] text-purple-600 font-semibold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-full">
                              <Copy size={9} /> {req.possible_duplicate_of}
                            </span>
                          )}
                          {req.remarks && req.remarks.includes('thread reply') && (
                            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-full">
                              Reply
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 mt-0.5 leading-tight">{req.title}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{req.requester_name} · {req.department}</p>
                      </div>
                      <span className={`inline-flex items-center justify-center h-[20px] px-2 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                        req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                      }`}>{req.urgency}</span>
                    </div>
                    {isAdmin ? (
                      <select
                        className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors duration-150"
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
                    ) : !isGuest ? (
                      <button
                        onClick={() => handleClaim(req.id)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-150"
                      >
                        <HandMetal size={13} /> Claim This Job
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Updated */}
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recently Updated</h2>
            <button onClick={() => navigate('/requests')} className="text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors duration-150">View All →</button>
          </div>
          {recentRequests.length === 0 ? (
            <div className="flex items-center gap-2.5 py-3 px-3">
              <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <Inbox className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">No recent activity</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {recentRequests.map((req: any, i: number) => (
                <div
                  key={req.id}
                  className={`flex items-center justify-between gap-3 py-2.5 cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors duration-150 ${i > 0 ? 'border-t border-gray-100 dark:border-gray-800/30' : ''}`}
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono leading-none">{req.request_id}</p>
                    <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate leading-snug mt-0.5">{req.title}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {req.assigned_name || 'Unassigned'}
                      {req.updated_at && <span> · {formatRelativeTime(req.updated_at)}</span>}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Summary */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FolderOpen size={15} className="text-purple-500" />
            Projects
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-150"
          >
            View Projects <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {projectCards.map((card) => (
            <KpiCardCell key={card.label} card={card} onClick={() => navigate(`/projects?${card.filter}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
