import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/shared/StatusBadge';
import {
  ClipboardList, UserCheck, Clock, AlertCircle, CheckCircle2, PlusCircle, Users, HandMetal, AlertTriangle, FolderOpen,
  ShieldCheck, Timer, ShieldAlert, TrendingUp
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

interface SlaStats {
  withinSLA: number;
  approachingSLA: number;
  overdueSLA: number;
  paused: number;
  compliance: number;
}

export default function Dashboard() {
  const { isAdmin, isGuest, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ total: 0, unassigned: 0, escalated: 0, inProgress: 0, pendingInfo: 0, completed: 0, new: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [unassignedRequests, setUnassignedRequests] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState({ total: 0, active: 0, planning: 0, completed: 0 });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [slaStats, setSlaStats] = useState<SlaStats>({ withinSLA: 0, approachingSLA: 0, overdueSLA: 0, paused: 0, compliance: 100 });
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
      setRecentProjects(dashData.recentProjects || []);
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

  const cards = [
    { label: 'Total Requests', value: stats.total, icon: ClipboardList, color: 'from-blue-500 to-blue-700', filter: '' },
    { label: 'New', value: stats.new, icon: PlusCircle, color: 'from-red-400 to-red-600', filter: 'status=New' },
    { label: 'Unassigned', value: stats.unassigned, icon: UserCheck, color: 'from-orange-400 to-orange-600', filter: 'unassigned=true' },
    { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, color: 'from-red-600 to-red-800', filter: 'unassigned=true' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'from-blue-400 to-blue-600', filter: 'status=In+Progress' },
    { label: 'Pending Info', value: stats.pendingInfo, icon: AlertCircle, color: 'from-yellow-400 to-yellow-600', filter: 'status=Pending+Info' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-green-400 to-green-600', filter: 'status=Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Welcome, {profile?.name || 'User'}</h1>
        <p className="text-white/70 capitalize">{profile?.role || ''} · Here's your overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((card) => (
          <div key={card.label} onClick={() => navigate(`/requests?${card.filter}`)} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
            <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <card.icon className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* SLA Widgets */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck size={18} /> SLA Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div onClick={() => navigate('/requests?slaStatus=Within+SLA')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-green-600">{slaStats.withinSLA}</p>
            <p className="text-xs text-gray-500">Within SLA</p>
          </div>
          <div onClick={() => navigate('/requests?slaStatus=Approaching+SLA')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Timer className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-amber-600">{slaStats.approachingSLA}</p>
            <p className="text-xs text-gray-500">Approaching SLA</p>
          </div>
          <div onClick={() => navigate('/requests?slaStatus=Overdue')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-red-600">{slaStats.overdueSLA}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
          <div onClick={() => navigate('/requests')} className="glass-card p-4 text-center cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-blue-600">{slaStats.compliance}%</p>
            <p className="text-xs text-gray-500">SLA Compliance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Requests */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-orange-500" />
              {isAdmin ? 'Unassigned Requests' : isGuest ? 'Unassigned Requests' : 'Available Jobs'}
            </h2>
            <span className="status-unassigned px-2 py-0.5 rounded-full text-xs font-medium">{unassignedRequests.length}</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unassignedRequests.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No unassigned requests</p>
            ) : (
              unassignedRequests.map((req: any) => {
                const isEscalated = req.days_unassigned >= 3;
                return (
                  <div key={req.id} className={`rounded-xl p-3 border ${isEscalated ? 'bg-red-50/60 border-red-300' : 'bg-white/50 border-orange-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 font-mono">{req.request_id}</p>
                          {isEscalated && (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                              <AlertTriangle size={12} /> {req.days_unassigned}d unassigned
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800">{req.title}</p>
                        <p className="text-xs text-gray-500">{req.requester_name} · {req.department}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                      }`}>{req.urgency}</span>
                    </div>
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <select
                          className="flex-1 text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
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

        {/* Recent Requests */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recently Updated</h2>
            <button onClick={() => navigate('/requests')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All →</button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentRequests.map((req: any) => (
              <div
                key={req.id}
                className="bg-white/50 rounded-xl p-3 cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => navigate(`/requests/${req.id}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-mono">{req.request_id}</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{req.title}</p>
                    <p className="text-xs text-gray-500">{req.assigned_name || 'Unassigned'}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FolderOpen size={18} className="text-purple-500" />
            Projects
          </h2>
          <button onClick={() => navigate('/projects')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All →</button>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-purple-700">{projectStats.total}</p>
            <p className="text-xs text-purple-500">Total</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-blue-700">{projectStats.active}</p>
            <p className="text-xs text-blue-500">Active</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-700">{projectStats.planning}</p>
            <p className="text-xs text-yellow-500">Planning</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-700">{projectStats.completed}</p>
            <p className="text-xs text-green-500">Completed</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="space-y-3">
          {recentProjects.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No projects yet</p>
          ) : (
            recentProjects.map((p: any) => {
              const statusColors: Record<string, string> = {
                Planning: 'bg-yellow-100 text-yellow-700',
                Active: 'bg-blue-100 text-blue-700',
                'On Hold': 'bg-orange-100 text-orange-700',
                Completed: 'bg-green-100 text-green-700',
                Cancelled: 'bg-red-100 text-red-700',
              };
              return (
                <div
                  key={p.id}
                  className="bg-white/50 rounded-xl p-3 cursor-pointer hover:bg-white/80 transition-colors"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-mono">{p.project_id}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
                        {p.health && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.health === 'On Track' ? 'bg-green-100 text-green-700' :
                            p.health === 'At Risk' ? 'bg-amber-100 text-amber-700' :
                            p.health === 'Delayed' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{p.health}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-1.5 rounded-full" style={{ width: `${p.progress || 0}%` }}></div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{p.progress || 0}%</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
