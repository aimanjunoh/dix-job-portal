import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, slaUtils } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/shared/StatusBadge';
import { ArrowLeft, Clock, User, Mail, Tag, AlertTriangle, MessageSquare, Edit2, Link, Unlink, Search, CheckCircle2, XCircle } from 'lucide-react';
import { formatRelativeTime } from '../utils/timeFormat';
import toast from 'react-hot-toast';

const STATUSES = ['New', 'In Progress', 'Pending Info', 'Pending Content', 'Pending Approval', 'Pending Vendor', 'Completed'];
const URGENCIES = ['Normal', 'Urgent', 'Critical'];

export default function RequestDetail() { 
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isGuest } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [form, setForm] = useState({ status: '', remarks: '', assigned_to: '', urgency: '' });
  const [linking, setLinking] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState<any[]>([]);
  const [relatedRequest, setRelatedRequest] = useState<any>(null);

  useEffect(() => {
    loadData();
    api.users.all().then(d => setStaffList(d.users)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (request) document.title = `Request ${request.request_id} — DIX Portal`;
  }, [request]);

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
      // Load related request info if linked
      if (data.request.related_request_id) {
        try {
          const related = await api.requests.get(data.request.related_request_id);
          setRelatedRequest(related.request);
        } catch {
          setRelatedRequest(null);
        }
      } else {
        setRelatedRequest(null);
      }
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

  const handleSearchForLinking = async (query: string) => {
    setLinkSearch(query);
    if (query.length < 2) {
      setLinkResults([]);
      return;
    }
    try {
      const results = await api.requests.searchForLinking(query, Number(id));
      setLinkResults(results);
    } catch {
      setLinkResults([]);
    }
  };

  const handleLinkRequest = async (relatedId: number) => {
    try {
      await api.requests.update(Number(id), { related_request_id: relatedId });
      toast.success('Requests linked');
      setLinking(false);
      setLinkSearch('');
      setLinkResults([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to link requests');
    }
  };

  const handleUnlinkRequest = async () => {
    try {
      await api.requests.update(Number(id), { related_request_id: null });
      toast.success('Requests unlinked');
      setRelatedRequest(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlink requests');
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
        <button onClick={() => navigate('/requests')} className="p-2 glass-card hover:bg-gray-100 dark:hover:bg-white/10 transition-colors rounded-xl">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{request.request_id}</h1>
            <StatusBadge status={request.status} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              request.urgency === 'Critical' ? 'urgency-critical' : request.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
            }`}>{request.urgency}</span>
            {relatedRequest && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 rounded-full font-medium cursor-pointer hover:bg-indigo-200"
                onClick={() => navigate(`/requests/${relatedRequest.id}`)}
                title={`Linked to: ${relatedRequest.title}`}
              >
                <Link size={10} /> Related: {relatedRequest.request_id}
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{request.title}</p>
        </div>
        {!isGuest && isAdmin && (
          <div className="relative">
            {request.related_request_id ? (
              <button onClick={handleUnlinkRequest} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Unlink request">
                <Unlink size={14} /> Unlink
              </button>
            ) : (
              <button onClick={() => setLinking(!linking)} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Link size={14} /> Link
              </button>
            )}
          </div>
        )}
        {!isGuest && (
          <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Edit2 size={14} /> {editing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {/* SLA Turnaround Alert Banner */}
      {request.status === 'Completed' && request.sla_turnaround && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          request.sla_turnaround === 'Met'
            ? 'bg-green-50 dark:bg-green-500/8 border-green-200 dark:border-green-800/40'
            : 'bg-red-50 dark:bg-red-500/8 border-red-200 dark:border-red-800/40'
        }`}>
          {request.sla_turnaround === 'Met' ? (
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <XCircle size={18} className="text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              request.sla_turnaround === 'Met' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            }`}>
              {request.sla_turnaround === 'Met' ? 'SLA Met' : 'SLA Missed'}
            </p>
            <p className={`text-xs mt-0.5 ${
              request.sla_turnaround === 'Met' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {request.sla_turnaround === 'Met'
                ? (request.sla_turnaround_days === 0
                  ? 'Completed exactly on the SLA due date'
                  : `Completed ${request.sla_turnaround_days} working day${request.sla_turnaround_days !== 1 ? 's' : ''} before the SLA deadline`)
                : `Completed ${request.sla_turnaround_days} working day${request.sla_turnaround_days !== 1 ? 's' : ''} after the SLA deadline`}
            </p>
          </div>
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
            request.sla_turnaround === 'Met'
              ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
          }`}>
            Due: {request.sla_due_date}
          </span>
        </div>
      )}

      {/* Link Request Panel */}
      {linking && (
        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-primary-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search for a request to link</span>
            <button onClick={() => { setLinking(false); setLinkSearch(''); setLinkResults([]); }} className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
          </div>
          <input
            type="text"
            placeholder="Search by REQ-ID or title..."
            value={linkSearch}
            onChange={(e) => handleSearchForLinking(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm mb-3"
            autoFocus
          />
          {linkResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {linkResults.map((r: any) => (
                <div
                  key={r.id}
                  onClick={() => handleLinkRequest(r.id)}
                  className="flex items-center gap-3 p-2 bg-white/50 dark:bg-white/5 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors"
                >
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{r.request_id}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{r.title}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
          {linkSearch.length >= 2 && linkResults.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">No matching requests found</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 glass p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Request Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Requester</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{request.requester_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{request.requester_email || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Department / Category</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{request.department || '-'} / {request.category || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{request.assigned_name || <span className="status-unassigned px-2 py-0.5 rounded-full text-xs">Unassigned</span>}</p>
              </div>
            </div>
          </div>

          {request.description && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3">{request.description}</p>
            </div>
          )}

          {request.remarks && !editing && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remarks</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3">{request.remarks}</p>
            </div>
          )}

          {/* SLA Information */}
          <div className="border-t border-gray-200 dark:border-gray-700/50 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Clock size={15} className="text-primary-500" /> SLA Information
            </h3>

            {request.status === 'Completed' ? (
              /* Turnaround result for completed requests */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">SLA Turnaround</p>
                  {request.sla_turnaround === 'Met' ? (
                    <span className="inline-flex items-center gap-1 h-[24px] px-2.5 rounded-full text-[11px] font-semibold leading-none bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                      <CheckCircle2 size={11} /> SLA Met
                    </span>
                  ) : request.sla_turnaround === 'Missed' ? (
                    <span className="inline-flex items-center gap-1 h-[24px] px-2.5 rounded-full text-[11px] font-semibold leading-none bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      <XCircle size={11} /> SLA Missed
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">SLA Due Date</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{request.sla_due_date || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {request.sla_turnaround === 'Met' ? 'Completed Early By' : request.sla_turnaround === 'Missed' ? 'Completed Late By' : 'Result'}
                  </p>
                  <p className={`text-sm font-semibold ${
                    request.sla_turnaround === 'Met' ? 'text-green-600 dark:text-green-400' :
                    request.sla_turnaround === 'Missed' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-400 dark:text-gray-500'
                  }`}>
                    {request.sla_turnaround
                      ? (request.sla_turnaround_days === 0
                        ? 'On the due date'
                        : `${request.sla_turnaround_days} working day${request.sla_turnaround_days !== 1 ? 's' : ''}`)
                      : '—'}
                  </p>
                </div>
              </div>
            ) : (
              /* Active request SLA panel */
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* SLA Status */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <span className={`inline-flex items-center h-[24px] px-2.5 rounded-full text-[11px] font-semibold leading-none ${
                      request.sla_status === 'Within SLA' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                      request.sla_status === 'Approaching SLA' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                      request.sla_status === 'Overdue' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                      request.sla_status === 'Paused' ? 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                      'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>{request.sla_status || 'Within SLA'}</span>
                  </div>

                  {/* SLA Due Date */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{request.sla_due_date || '—'}</p>
                  </div>

                  {/* Days Remaining or Overdue */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {request.sla_overdue_days !== null && request.sla_overdue_days !== undefined ? 'Days Overdue' : 'Working Days Left'}
                    </p>
                    <p className={`text-sm font-semibold ${
                      request.sla_overdue_days !== null && request.sla_overdue_days !== undefined
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {request.sla_overdue_days !== null && request.sla_overdue_days !== undefined
                        ? `${request.sla_overdue_days} days overdue`
                        : request.sla_days_remaining !== null && request.sla_days_remaining !== undefined
                          ? `${request.sla_days_remaining} days`
                          : '—'}
                    </p>
                  </div>
                </div>

                {/* Paused details (conditional) */}
                {request.sla_paused_at && (
                  <div className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-800/30">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Paused Since</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{formatRelativeTime(request.sla_paused_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Paused Days</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{request.sla_paused_days || 0} working days</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Pause Duration</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {slaUtils.workingDaysBetween(new Date(request.sla_paused_at), new Date())} working days
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Edit Form */}
          {editing && (
            <form onSubmit={handleUpdate} className="border-t border-gray-200 dark:border-gray-700/50 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
                  <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                    {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                    <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                      <option value="">Unassigned</option>
                      {staffList.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                  <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-xl font-medium transition-colors">Save Changes</button>
              </div>
            </form>
          )}

          <div className="text-xs text-gray-400 dark:text-gray-500 flex gap-4">
            <span>Created: {formatRelativeTime(request.created_at)}</span>
            <span>Updated: {formatRelativeTime(request.updated_at)}</span>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="glass p-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary-500" /> Activity Log
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No activity recorded</p>
            ) : (
              activities.map((act: any) => (
                <div key={act.id} className="flex gap-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{act.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{act.details}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{act.performed_by} · {formatRelativeTime(act.timestamp)}</p>
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
