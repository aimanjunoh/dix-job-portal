import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/shared/Modal';
import { ArrowLeft, Plus, Trash2, Check, Edit2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
const TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];
const TASK_PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];
const TABS = ['Overview', 'Milestones', 'Tasks', 'Notes'] as const;

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();
  const [tab, setTab] = useState<typeof TABS[number]>('Overview');
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Forms
  const [editForm, setEditForm] = useState<any>({});
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', due_date: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', milestone_id: '', assigned_to: '', status: 'Todo', priority: 'Normal', due_date: '' });
  const [newMemberId, setNewMemberId] = useState('');

  useEffect(() => { loadProject(); api.users.all().then(d => setStaffList(d.users)).catch(() => {}); }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await api.projects.get(Number(id));
      setProject(data.project);
      setMembers(data.members);
      setMilestones(data.milestones);
      setTasks(data.tasks);
      setNotes(data.notes);
    } catch (err: any) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Project edit
  const openEdit = () => {
    setEditForm({ title: project.title, description: project.description, status: project.status, owner_id: project.owner_id, start_date: project.start_date || '', due_date: project.due_date || '', progress: project.progress });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.projects.update(Number(id), editForm);
      toast.success('Project updated');
      setEditOpen(false);
      loadProject();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Milestones
  const handleAddMilestone = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.projects.addMilestone(Number(id), milestoneForm);
      toast.success('Milestone added');
      setMilestoneOpen(false);
      setMilestoneForm({ title: '', description: '', due_date: '' });
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleMilestone = async (ms: any) => {
    try {
      await api.projects.updateMilestone(ms.id, { completed: !ms.completed });
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteMilestone = async (msId: number) => {
    try {
      await api.projects.deleteMilestone(msId);
      toast.success('Milestone deleted');
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  // Tasks
  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.projects.addTask(Number(id), taskForm);
      toast.success('Task added');
      setTaskOpen(false);
      setTaskForm({ title: '', description: '', milestone_id: '', assigned_to: '', status: 'Todo', priority: 'Normal', due_date: '' });
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      await api.projects.updateTask(taskId, { status });
      // Auto-calculate progress
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
      const doneCount = updatedTasks.filter(t => t.status === 'Done').length;
      const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0;
      await api.projects.update(Number(id), { progress });
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await api.projects.deleteTask(taskId);
      toast.success('Task deleted');
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  // Notes
  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.projects.addNote(Number(id), noteText);
      setNoteText('');
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteNote = async (noteId: number) => {
    try {
      await api.projects.deleteNote(noteId);
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  // Members
  const handleAddMember = async () => {
    if (!newMemberId) return;
    try {
      await api.projects.addMember(Number(id), newMemberId);
      toast.success('Member added');
      setAddMemberOpen(false);
      setNewMemberId('');
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  const removeMember = async (userId: string) => {
    try {
      await api.projects.removeMember(Number(id), userId);
      toast.success('Member removed');
      loadProject();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>;
  if (!project) return <div className="text-center py-20 text-white/60">Project not found</div>;

  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-2"><ArrowLeft size={14} /> Back to Projects</button>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{project.title}</h1>
          <p className="text-white/70 mt-1">{project.project_id} &middot; Owner: {project.owner_name || 'Unassigned'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm"><Edit2 size={14} /> Edit</button>
        </div>
      </div>

      {/* Progress & Stats */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-bold text-gray-800">{project.progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="text-center"><p className="text-lg font-bold text-gray-800">{milestones.length}</p><p className="text-xs text-gray-500">Milestones</p></div>
          <div className="text-center"><p className="text-lg font-bold text-gray-800">{totalTasks}</p><p className="text-xs text-gray-500">Tasks</p></div>
          <div className="text-center"><p className="text-lg font-bold text-gray-800">{doneTasks}</p><p className="text-xs text-gray-500">Completed</p></div>
          <div className="text-center"><p className="text-lg font-bold text-gray-800">{members.length}</p><p className="text-xs text-gray-500">Members</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Project Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${project.status === 'Active' ? 'bg-blue-100 text-blue-700' : project.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{project.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="text-gray-700">{project.start_date || 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span className="text-gray-700">{project.due_date || 'Not set'}</span></div>
            </div>
            {project.description && <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-sm text-gray-700">{project.description}</p></div>}
          </div>
          <div className="glass p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Team Members</h2>
              <button onClick={() => setAddMemberOpen(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
            <div className="space-y-2">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">{m.users?.name?.charAt(0) || '?'}</div>
                    <div><p className="text-sm font-medium text-gray-800">{m.users?.name}</p><p className="text-xs text-gray-500">{m.role}</p></div>
                  </div>
                  {isAdmin && m.role !== 'owner' && <button onClick={() => removeMember(m.user_id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12} /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Milestones' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setMilestoneOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white text-primary-600 rounded-xl text-sm font-medium hover:shadow-lg"><Plus size={14} /> Add Milestone</button>
          </div>
          {milestones.length === 0 ? (
            <div className="glass p-8 text-center text-gray-500">No milestones yet</div>
          ) : (
            milestones.map(ms => {
              const msTasks = tasks.filter(t => t.milestone_id === ms.id);
              const msDone = msTasks.filter(t => t.status === 'Done').length;
              return (
                <div key={ms.id} className={`glass-card p-4 ${ms.completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleMilestone(ms)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${ms.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
                        {ms.completed && <Check size={12} />}
                      </button>
                      <div>
                        <h3 className={`font-medium text-gray-800 ${ms.completed ? 'line-through' : ''}`}>{ms.title}</h3>
                        {ms.description && <p className="text-sm text-gray-500 mt-0.5">{ms.description}</p>}
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          {ms.due_date && <span>Due: {ms.due_date}</span>}
                          <span>{msDone}/{msTasks.length} tasks done</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteMilestone(ms.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'Tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setTaskOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white text-primary-600 rounded-xl text-sm font-medium hover:shadow-lg"><Plus size={14} /> Add Task</button>
          </div>
          {tasks.length === 0 ? (
            <div className="glass p-8 text-center text-gray-500">No tasks yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {TASK_STATUSES.map(status => (
                <div key={status} className="glass p-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{status} ({tasks.filter(t => t.status === status).length})</h3>
                  <div className="space-y-2">
                    {tasks.filter(t => t.status === status).map(task => (
                      <div key={task.id} className="bg-white/80 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 flex-1">{task.title}</p>
                          <button onClick={() => deleteTask(task.id)} className="p-0.5 text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                        {task.assigned_name && <p className="text-xs text-gray-500 mb-1">{task.assigned_name}</p>}
                        {task.milestone_title && <p className="text-xs text-primary-500 mb-2">{task.milestone_title}</p>}
                        <div className="flex items-center justify-between">
                          <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500">
                            {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'Critical' ? 'bg-red-100 text-red-700' : task.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{task.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Notes' && (
        <div className="space-y-4">
          <div className="glass p-4">
            <div className="flex gap-2">
              <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder="Add a note or update..." className="flex-1 px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              <button onClick={handleAddNote} className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600"><Send size={16} /></button>
            </div>
          </div>
          {notes.length === 0 ? (
            <div className="glass p-8 text-center text-gray-500">No notes yet</div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-700">{note.note}</p>
                    <p className="text-xs text-gray-400 mt-1">{note.user_name} &middot; {new Date(note.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Project Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Project" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">{PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Progress ({editForm.progress}%)</label><input type="range" min="0" max="100" value={editForm.progress} onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })} className="w-full" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm rounded-xl font-medium">Save</button></div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal isOpen={milestoneOpen} onClose={() => setMilestoneOpen(false)} title="Add Milestone" size="sm">
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setMilestoneOpen(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm rounded-xl font-medium">Add</button></div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={taskOpen} onClose={() => setTaskOpen(false)} title="Add Task" size="sm">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Milestone</label><select value={taskForm.milestone_id} onChange={(e) => setTaskForm({ ...taskForm, milestone_id: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"><option value="">None</option>{milestones.map(ms => <option key={ms.id} value={ms.id}>{ms.title}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label><select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"><option value="">Unassigned</option>{staffList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">{TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setTaskOpen(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm rounded-xl font-medium">Add</button></div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add Member" size="sm">
        <div className="space-y-4">
          <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
            <option value="">Select a user</option>
            {staffList.filter((u: any) => !members.some(m => m.user_id === u.id)).map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
          </select>
          <div className="flex justify-end gap-3"><button onClick={() => setAddMemberOpen(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button><button onClick={handleAddMember} className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm rounded-xl font-medium">Add</button></div>
        </div>
      </Modal>
    </div>
  );
}
