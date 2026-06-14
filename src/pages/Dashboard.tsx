import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/shared/StatusBadge';
import {
  ClipboardList, UserCheck, Clock, AlertCircle, CheckCircle2, PlusCircle, Users, HandMetal, AlertTriangle, FolderOpen,
  Briefcase, BarChart3, ArrowRight, ShieldAlert, Timer, XCircle, Copy
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

  const cards = [
    { label: 'Total Requests', value: stats.total, icon: ClipboardList, color: 'from-primary-500 to-primary-700', filter: '' },
    { label: 'New', value: stats.new, icon: PlusCircle, color: 'from-red-400 to-red-600', filter: 'status=New' },
    { label: 'Unassigned', value: stats.unassigned, icon: UserCheck, color: 'from-orange-400 to-orange-600', filter: 'unassigned=true' },
    { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, color: 'from-red-600 to-red-800', filter: 'unassigned=true' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'from-primary-400 to-primary-600', filter: 'status=In+Progress' },
    { label: 'Pending Info', value: stats.pendingInfo, icon: AlertCircle, color: 'from-yellow-400 to-yellow-600', filter: 'status=Pending+Info' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-green-400 to-green-600', filter: 'status=Completed' },
  ];

  const projectCards = [
    { label: 'Active Projects', value: projectStats.active, icon: Timer, color: 'from-primary-500 to-primary-700', filter: 'status=Active' },
    { label: 'Delayed', value: projectStats.delayed, icon: XCircle, color: 'from-red-500 to-red-700', filter: '' },
    { label: 'Completed', value: projectStats.completed, icon: CheckCircle2, color: 'from-green-400 to-green-600', filter: 'status=Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header — Identity Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-0.5">
            Welcome back, {profile?.name || 'User'}
          </h1>
          {profile?.department && (
            <p className="text-white/60 text-sm mb-1.5">{profile.department}</p>
          )}
          <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm">
            {roleLabel}
          </span>
        </div>
        <button
          onClick={() => navigate('/insights')}
          className="hidden md:flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all border border-white/10"
        >
          <BarChart3 size={14} />
          Insights & Reports
        </button>
      </div>

      {/* Section A — Request Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} onClick={() => navigate(`/requests?${card.filter}`)} className="group relative glass-card p-4 text-center cursor-pointer hover:shadow-lg transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm`}>
              <card.icon className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Section B — My Workload (prominent for staff users) */}
      {!isGuest && myStats.assigned >= 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Briefcase size={18} /> My Workload
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div onClick={() => navigate('/requests?mine=true')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ClipboardList className="text-white" size={18} />
              </div>
              <p className="text-2xl font-bold text-primary-600">{myStats.assigned}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Assigned</p>
            </div>
            <div onClick={() => navigate('/requests?mine=true&status=In+Progress')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="text-white" size={18} />
              </div>
              <p className="text-2xl font-bold text-amber-600">{myStats.active}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            </div>
            <div onClick={() => navigate('/requests?mine=true&slaStatus=Overdue')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ShieldAlert className="text-white" size={18} />
              </div>
              <p className="text-2xl font-bold text-red-600">{myStats.overdue}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
            </div>
            <div onClick={() => navigate('/requests?mine=true&status=Completed')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="text-white" size={18} />
              </div>
              <p className="text-2xl font-bold text-green-600">{myStats.completed}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>
          <div className="glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">My Active Requests</h3>
              <button onClick={() => navigate('/requests?mine=true')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All My Requests →</button>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {myRequests.length === 0 ? (
                <div className="text-center py-6">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 dark:text-gray-500 text-sm">No active requests assigned to you</p>
                  <button onClick={() => navigate('/requests')} className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2">View all requests →</button>
                </div>
              ) : (
                myRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="bg-white/50 dark:bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                    onClick={() => navigate(`/requests/${req.id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{req.request_id}</p>
                          {req.sla_status === 'Overdue' && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Overdue</span>
                          )}
                          {req.sla_status === 'Approaching SLA' && (
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Due Soon</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{req.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{req.requester_name} · {req.department}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={req.status} />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Users size={18} className="text-orange-500" />
              {isAdmin ? 'Unassigned Requests' : isGuest ? 'Unassigned Requests' : 'Available Jobs'}
            </h2>
            <span className="status-unassigned px-2 py-0.5 rounded-full text-xs font-medium">{unassignedRequests.length}</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unassignedRequests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No unassigned requests</p>
            ) : (
              unassignedRequests.map((req: any) => {
                const isEscalated = req.days_unassigned >= 3;
                return (
                  <div key={req.id} className={`rounded-xl p-3 border ${isEscalated ? 'bg-red-50/60 dark:bg-red-900/20 border-red-300 dark:border-red-700' : 'bg-white/50 dark:bg-white/5 border-orange-100 dark:border-orange-800'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{req.request_id}</p>
                          {isEscalated && (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                              <AlertTriangle size={12} /> {req.days_unassigned}d unassigned
                            </span>
                          )}
                          {req.possible_duplicate_of && (
                            <span className="flex items-center gap-1 text-xs text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded-full">
                              <Copy size={10} /> Possible follow-up of {req.possible_duplicate_of}
                            </span>
                          )}
                          {req.remarks && req.remarks.includes('thread reply') && (
                            <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full">
                              Email Reply
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{req.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{req.requester_name} · {req.department}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                      }`}>{req.urgency}</span>
                    </div>
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <select
                          className="flex-1 text-xs px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                        className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg font-medium hover:shadow-md transition-all"
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
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Recently Updated</h2>
            <button onClick={() => navigate('/requests')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All →</button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentRequests.map((req: any) => (
              <div
                key={req.id}
                className="bg-white/50 dark:bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                onClick={() => navigate(`/requests/${req.id}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{req.request_id}</p>
                      {req.possible_duplicate_of && (
                        <span className="flex items-center gap-1 text-xs text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded-full">
                          <Copy size={10} /> Follow-up?
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{req.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{req.assigned_name || 'Unassigned'}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section E — Compact Project Summary */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <FolderOpen size={18} className="text-purple-500" />
            Projects
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg hover:shadow-md transition-all"
          >
            View Projects <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {projectCards.map((card) => (
            <div key={card.label} onClick={() => navigate(`/projects?${card.filter}`)} className="bg-white/50 dark:bg-white/5 rounded-xl p-4 text-center cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-md hover:scale-[1.03] transition-all">
              <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <card.icon className="text-white" size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
