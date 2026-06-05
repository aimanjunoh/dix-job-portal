import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/shared/StatusBadge';
import { ArrowLeft, Clock, User, Mail, Tag, AlertTriangle, MessageSquare, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['New', 'In Progress', 'Pending Info', 'Completed'];
const URGENCIES = ['Normal', 'Urgent', 'Critical'];

export default function RequestDetail() { 
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [form, setForm] = useState({ status: '', remarks: '', assigned_to: '', urgency: '' });

  useEffect(() => {
    loadData();
    api.users.all().then(d => setStaffList(d.users)).catch(() => {});
  }, [id]);

  const loadData = async () => {
    try {
      const data = await api.requests.get(Number(id));
      setRequest(data.request);
      setActivities(data.activities);
      setForm({
        status: data.request.status,
        remarks: data.request.remarks || '',
        assigned_to: data.request.assigned_to ? String(data.request.assigned_to) : '',
        urgency: data.request.urgency
      });
    } catch (err: any) {
      toast.error('Request not found');
      navigate('/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data: any = { status: form.status, remarks: form.remarks, urgency: form.urgency };
      if (isAdmin) data.assigned_to = form.assigned_to || null
      await api.requests.update(Number(id), data);
      toast.success('Request updated');
      setEditing(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
    </div>
  );

  if (!request) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/requests')} className="p-2 glass-card hover:bg-white/90">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-white">{request.request_id}</h1>
            <StatusBadge status={request.status} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              request.urgency === 'Critical' ? 'urgency-critical' : request.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
            }`}>{request.urgency}</span>
          </div>
          <p className="text-white/70 text-sm mt-1">{request.title}</p>
        </div>
        <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 bg-white text-primary-600 rounded-xl text-sm font-medium hover:shadow-lg transition-all">
          <Edit2 size={14} /> {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 glass p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Request Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Requester</p>
                <p className="text-sm font-medium text-gray-800">{request.requester_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-800">{request.requester_email || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Department / Category</p>
                <p className="text-sm text-gray-800">{request.department || '-'} / {request.category || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Assigned To</p>
                <p className="text-sm font-medium text-gray-800">{request.assigned_name || <span className="status-unassigned px-2 py-0.5 rounded-full text-xs">Unassigned</span>}</p>
              </div>
            </div>
          </div>

          {request.description && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 bg-white/40 rounded-xl p-3">{request.description}</p>
            </div>
          )}

          {request.remarks && !editing && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Remarks</p>
              <p className="text-sm text-gray-700 bg-white/40 rounded-xl p-3">{request.remarks}</p>
            </div>
          )}

          {/* Edit Form */}
          {editing && (
            <form onSubmit={handleUpdate} className="border-t border-gray-200/50 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                    {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                      <option value="">Unassigned</option>
                      {staffList.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm rounded-xl font-medium hover:shadow-lg transition-all">Save Changes</button>
              </div>
            </form>
          )}

          <div className="text-xs text-gray-400 flex gap-4">
            <span>Created: {new Date(request.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(request.updated_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="glass p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary-500" /> Activity Log
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No activity recorded</p>
            ) : (
              activities.map((act: any) => (
                <div key={act.id} className="flex gap-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{act.action}</p>
                    <p className="text-xs text-gray-500">{act.details}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{act.performed_by} · {new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
