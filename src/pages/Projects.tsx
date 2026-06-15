import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/shared/Modal';
import { Plus, Search, FolderOpen, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
const STATUS_COLORS: Record<string, string> = {
  Planning: 'bg-gray-100 text-gray-700',
  Active: 'bg-primary-100 text-primary-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const HEALTH_COLORS: Record<string, string> = {
  'On Track': 'bg-green-100 text-green-700',
  'At Risk': 'bg-amber-100 text-amber-700',
  'Delayed': 'bg-red-100 text-red-700',
  'Completed': 'bg-primary-100 text-primary-700',
};

export default function Projects() {
  useEffect(() => { document.title = 'Projects — DIX Portal'; }, []);
  const { isAdmin, isGuest, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', owner_id: '', status: 'Planning',
    start_date: '', due_date: '', member_ids: [] as string[],
  });

  useEffect(() => { loadProjects(); }, [search, statusFilter]);
  useEffect(() => { api.users.all().then(d => setStaffList(d.users)).catch(() => {}); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.projects.list(params);
      setProjects(data.projects);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ title: '', description: '', owner_id: profile?.id || '', status: 'Planning', start_date: '', due_date: '', member_ids: [] });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.projects.create(form);
      toast.success('Project created');
      setModalOpen(false);
      loadProjects();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.projects.delete(id);
      toast.success('Project deleted');
      setDeleteConfirm(null);
      loadProjects();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleMember = (id: string) => {
    setForm(f => ({
      ...f,
      member_ids: f.member_ids.includes(id) ? f.member_ids.filter(m => m !== id) : [...f.member_ids, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total projects</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors text-sm w-full sm:w-auto">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="glass p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search projects..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px]">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="glass p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No projects yet. Create your first project!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <div key={project.id} className="glass-card p-5 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{project.project_id}</p>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{project.title}</h3>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[project.status] || ''}`}>{project.status}</span>
              </div>
              {project.health && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block ${HEALTH_COLORS[project.health] || 'bg-gray-100 text-gray-600'}`}>
                  {project.health}
                </span>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{project.description || 'No description'}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Owner: {project.owner_name || 'Unassigned'}</span>
                <span>{project.due_date ? `Due: ${project.due_date}` : ''}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 rounded-lg"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Project" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Owner</label>
              <select value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                <option value="">Select owner</option>
                {staffList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Members</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {staffList.map((u: any) => (
                <button key={u.id} type="button" onClick={() => toggleMember(u.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${form.member_ids.includes(u.id) ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}>
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-xl font-medium transition-colors">Create Project</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Delete Project" size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Are you sure? This will delete all milestones, tasks, and notes for this project.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-6 py-2.5 bg-red-500 text-white text-sm rounded-xl font-medium hover:bg-red-600 transition-all">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
