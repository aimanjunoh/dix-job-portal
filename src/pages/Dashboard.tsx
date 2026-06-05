import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/shared/StatusBadge';
import {
  ClipboardList, UserCheck, Clock, AlertCircle, CheckCircle2, PlusCircle, Users
} from 'lucide-react';

interface Stats {
  total: number;
  unassigned: number;
  inProgress: number;
  pendingInfo: number;
  completed: number;
  new: number;
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ total: 0, unassigned: 0, inProgress: 0, pendingInfo: 0, completed: 0, new: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [unassignedRequests, setUnassignedRequests] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const cards = [
    { label: 'Total Requests', value: stats.total, icon: ClipboardList, color: 'from-blue-500 to-blue-700', filter: '' },
    { label: 'New', value: stats.new, icon: PlusCircle, color: 'from-red-400 to-red-600', filter: 'status=New' },
    { label: 'Unassigned', value: stats.unassigned, icon: UserCheck, color: 'from-orange-400 to-orange-600', filter: 'unassigned=true' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'from-blue-400 to-blue-600', filter: 'status=In+Progress' },
    { label: 'Pending Info', value: stats.pendingInfo, icon: AlertCircle, color: 'from-yellow-400 to-yellow-600', filter: 'status=Pending+Info' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-green-400 to-green-600', filter: 'status=Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-white/70">Welcome back! Here's your overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Requests */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-orange-500" />
              Unassigned Requests
            </h2>
            <span className="status-unassigned px-2 py-0.5 rounded-full text-xs font-medium">{unassignedRequests.length}</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unassignedRequests.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No unassigned requests</p>
            ) : (
              unassignedRequests.map((req: any) => (
                <div key={req.id} className="bg-white/50 rounded-xl p-3 border border-orange-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-500 font-mono">{req.request_id}</p>
                      <p className="text-sm font-medium text-gray-800">{req.title}</p>
                      <p className="text-xs text-gray-500">{req.requester_name} · {req.department}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                    }`}>{req.urgency}</span>
                  </div>
                  {isAdmin && (
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
                  )}
                </div>
              ))
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
    </div>
  );
}
