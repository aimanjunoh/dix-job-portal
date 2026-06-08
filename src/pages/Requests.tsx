import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/shared/Modal';
import StatusBadge from '../components/shared/StatusBadge';
import { Plus, Search, Edit2, Trash2, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['New', 'In Progress', 'Pending Info', 'Completed'];
const URGENCIES = ['Normal', 'Urgent', 'Critical'];

export default function Requests() {
  const { isAdmin, isGuest } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [slaFilter, setSlaFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const limit = 10;

  const [form, setForm] = useState({
    title: '', requester_name: '', requester_email: '', department: '', category: '',
    urgency: 'Normal', description: '', assigned_to: '', status: 'New', remarks: ''
  });

  useEffect(() => {
    const status = searchParams.get('status');
    const unassigned = searchParams.get('unassigned');
    const slaStatus = searchParams.get('slaStatus');
    if (status) setStatusFilter(status);
    if (unassigned === 'true') setUnassignedOnly(true);
    if (slaStatus) setSlaFilter(slaStatus);
  }, []);

  useEffect(() => { loadRequests(); }, [page, search, statusFilter, hideCompleted, unassignedOnly, slaFilter]);
  useEffect(() => { api.users.all().then(d => setStaffList(d.users)).catch(() => {}); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (hideCompleted) params.hideCompleted = 'true';
      if (unassignedOnly) params.unassigned = 'true';
      if (slaFilter) params.slaStatus = slaFilter;
      const data = await api.requests.list(params);
      setRequests(data.requests);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingReq(null);
    setForm({ title: '', requester_name: '', requester_email: '', department: '', category: '', urgency: 'Normal', description: '', assigned_to: '', status: 'New', remarks: '' });
    setModalOpen(true);
  };

  const openEdit = (req: any) => {
    setEditingReq(req);
    setForm({
      title: req.title, requester_name: req.requester_name, requester_email: req.requester_email,
      department: req.department, category: req.category, urgency: req.urgency,
      description: req.description, assigned_to: req.assigned_to ? String(req.assigned_to) : '',
      status: req.status, remarks: req.remarks || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, assigned_to: form.assigned_to || null };
      if (editingReq) {
        await api.requests.update(editingReq.id, data);
        toast.success('Request updated');
      } else {
        await api.requests.create(data);
        toast.success('Request created');
      }
      setModalOpen(false);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.requests.delete(id);
      toast.success('Request deleted');
      setDeleteConfirm(null);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Job Requests</h1>
          <p className="text-white/70">{total} total requests</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-white text-primary-600 rounded-xl font-medium hover:shadow-lg transition-all text-sm">
            <Plus size={16} /> New Request
          </button>
        )}
      </div>

      {/* Search, Filter, Toggle */}
      <div className="glass p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by ID, title, requester, department..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={hideCompleted} onChange={(e) => { setHideCompleted(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
            Hide Completed
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={unassignedOnly} onChange={(e) => { setUnassignedOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
            Unassigned Only
          </label>
          <select value={slaFilter} onChange={(e) => { setSlaFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-white/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
            <option value="">All SLA</option>
            <option value="Within SLA">Within SLA</option>
            <option value="Approaching SLA">Approaching SLA</option>
            <option value="Overdue">Overdue</option>
            <option value="Paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Requester</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Assigned</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Urgency</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">SLA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No requests found</td></tr>
              ) : (
                requests.map((req: any) => (
                  <tr key={req.id} className="border-b border-gray-100/50 hover:bg-white/30">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{req.request_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{req.title}</p>
                      <p className="text-xs text-gray-500 md:hidden">{req.requester_name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{req.requester_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {req.assigned_name || <span className="status-unassigned px-2 py-0.5 rounded-full text-xs">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.urgency === 'Critical' ? 'urgency-critical' : req.urgency === 'Urgent' ? 'urgency-urgent' : 'urgency-normal'
                      }`}>{req.urgency}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {req.sla_status && req.status !== 'Completed' ? (
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            req.sla_status === 'Within SLA' ? 'bg-green-100 text-green-700' :
                            req.sla_status === 'Approaching SLA' ? 'bg-amber-100 text-amber-700' :
                            req.sla_status === 'Overdue' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{req.sla_status}</span>
                          {req.sla_days_remaining !== null && req.sla_days_remaining !== undefined && (
                            <p className="text-xs text-gray-400 mt-0.5">{req.sla_days_remaining}d left</p>
                          )}
                          {req.sla_overdue_days !== null && req.sla_overdue_days !== undefined && (
                            <p className="text-xs text-red-500 mt-0.5">{req.sla_overdue_days}d overdue</p>
                          )}
                        </div>
                      ) : req.status === 'Completed' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/requests/${req.id}`)} className="p-2 hover:bg-green-50 text-green-500 rounded-lg"><Eye size={14} /></button>
                        {!isGuest && <button onClick={() => openEdit(req)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit2 size={14} /></button>}
                        {isAdmin && <button onClick={() => setDeleteConfirm(req.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200/50">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs bg-white/60 rounded-lg disabled:opacity-50 hover:bg-white/80">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs bg-white/60 rounded-lg disabled:opacity-50 hover:bg-white/80">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingReq ? 'Edit Request' : 'Create Request'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name *</label>
              <input type="text" value={form.requester_name} onChange={(e) => setForm({ ...form, requester_name: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requester Email</label>
              <input type="email" value={form.requester_email} onChange={(e) => setForm({ ...form, requester_email: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm rounded-xl font-medium hover:shadow-lg transition-all">
              {editingReq ? 'Update Request' : 'Create Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Request" size="sm">
        <p className="text-gray-600 mb-4">Are you sure you want to delete this request? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-6 py-2.5 bg-red-500 text-white text-sm rounded-xl font-medium hover:bg-red-600 transition-all">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
