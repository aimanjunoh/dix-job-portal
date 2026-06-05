import { supabase } from '../lib/supabase';

// Generate unique action token
function generateToken(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Generate next request ID
async function generateRequestId(): Promise<string> {
  const { data } = await supabase
    .from('requests')
    .select('request_id')
    .order('id', { ascending: false })
    .limit(1)
    .single();
  if (!data) return 'REQ-0001';
  const num = parseInt(data.request_id.replace('REQ-', '')) + 1;
  return `REQ-${String(num).padStart(4, '0')}`;
}

// Log activity
async function logActivity(requestId: number | null, action: string, performedBy: string, details: string) {
  await supabase.from('activity_logs').insert({
    request_id: requestId,
    action,
    performed_by: performedBy,
    details,
  });
}

// Send email via Vercel serverless function
async function sendEmail(to: string | string[], subject: string, type: string, data: any): Promise<boolean> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, type, data }),
    });
    return res.ok;
  } catch {
    console.warn('Email send failed — RESEND_API_KEY may not be configured');
    return false;
  }
}

// Get admin emails
async function getAdminEmails(): Promise<string[]> {
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'admin')
    .eq('status', 'active');
  return (data || []).map(u => u.email);
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
      return { user, profile };
    },
  },

  users: {
    list: async (params: Record<string, any> = {}) => {
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });

      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,department.ilike.%${params.search}%`);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;
      return { users: data || [], total: count || 0, page, limit };
    },

    all: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, department')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return { users: data || [] };
    },

    get: async (id: string) => {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error) throw error;
      return { user: data };
    },

    create: async (userData: any) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      if (authError) throw authError;

      if (authData.user) {
        const { data, error } = await supabase.from('users').insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role || 'staff',
          department: userData.department || '',
          status: userData.status || 'active',
        }).select().single();
        if (error) throw error;

        await logActivity(null, 'User Created', 'Admin', `User ${userData.name} created`);
        return { user: data };
      }
      throw new Error('Failed to create user');
    },

    update: async (id: string, userData: any) => {
      const updateData: any = {};
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.department !== undefined) updateData.department = userData.department;
      if (userData.status !== undefined) updateData.status = userData.status;

      const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      await logActivity(null, 'User Updated', 'Admin', `User ${userData.name || data.name} updated`);
      return { user: data };
    },

    delete: async (id: string) => {
      const { data: user } = await supabase.from('users').select('name').eq('id', id).single();
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;

      await logActivity(null, 'User Deleted', 'Admin', `User ${user?.name} deleted`);
      return { message: 'User deleted' };
    },
  },

  requests: {
    list: async (params: Record<string, any> = {}) => {
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('requests')
        .select('*, users!assigned_to(name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params.search) {
        query = query.or(`request_id.ilike.%${params.search}%,title.ilike.%${params.search}%,requester_name.ilike.%${params.search}%,department.ilike.%${params.search}%`);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.hideCompleted === 'true') {
        query = query.neq('status', 'Completed');
      }
      if (params.unassigned === 'true') {
        query = query.is('assigned_to', null);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      const requests = (data || []).map((r: any) => ({
        ...r,
        assigned_name: r.users?.name || null,
        users: undefined,
      }));

      return { requests, total: count || 0, page, limit };
    },

    dashboard: async () => {
      const { data: allRequests } = await supabase.from('requests').select('*');
      const requests = allRequests || [];

      const stats = {
        total: requests.length,
        unassigned: requests.filter(r => !r.assigned_to).length,
        inProgress: requests.filter(r => r.status === 'In Progress').length,
        pendingInfo: requests.filter(r => r.status === 'Pending Info').length,
        completed: requests.filter(r => r.status === 'Completed').length,
        new: requests.filter(r => r.status === 'New').length,
      };

      const { data: recentRequests } = await supabase
        .from('requests')
        .select('*, users!assigned_to(name)')
        .order('updated_at', { ascending: false })
        .limit(5);

      const recent = (recentRequests || []).map((r: any) => ({
        ...r,
        assigned_name: r.users?.name || null,
        users: undefined,
      }));

      const { data: unassignedRequests } = await supabase
        .from('requests')
        .select('*')
        .is('assigned_to', null)
        .order('created_at', { ascending: false })
        .limit(10);

      return { stats, recentRequests: recent, unassignedRequests: unassignedRequests || [] };
    },

    get: async (id: number) => {
      const { data: request, error } = await supabase
        .from('requests')
        .select('*, users!assigned_to(name)')
        .eq('id', id)
        .single();
      if (error) throw error;

      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('request_id', id)
        .order('timestamp', { ascending: false });

      return {
        request: { ...request, assigned_name: request?.users?.name || null, users: undefined },
        activities: activities || [],
      };
    },

    create: async (requestData: any) => {
      const request_id = await generateRequestId();
      const action_token = generateToken();

      const { data, error } = await supabase.from('requests').insert({
        request_id,
        title: requestData.title,
        requester_name: requestData.requester_name,
        requester_email: requestData.requester_email || '',
        department: requestData.department || '',
        category: requestData.category || '',
        urgency: requestData.urgency || 'Normal',
        description: requestData.description || '',
        assigned_to: requestData.assigned_to || null,
        status: requestData.status || 'New',
        remarks: requestData.remarks || '',
        due_date: requestData.due_date || null,
        action_token,
      }).select().single();
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await logActivity(data.id, 'Request Created', user?.email || 'System', `${requestData.title} created`);

      if (requestData.assigned_to) {
        const { data: assignee } = await supabase.from('users').select('name').eq('id', requestData.assigned_to).single();
        await logActivity(data.id, 'Request Assigned', user?.email || 'System', `Assigned to ${assignee?.name || 'Unknown'}`);
      }

      // Send email notification to admins
      const adminEmails = await getAdminEmails();
      if (adminEmails.length > 0) {
        sendEmail(adminEmails, `New Request: ${request_id} — ${requestData.title}`, 'new_request', {
          ...data,
          token: action_token,
          admin_emails: adminEmails,
        });
      }

      // If assigned, send assignment email
      if (requestData.assigned_to) {
        const { data: assignee } = await supabase.from('users').select('name, email').eq('id', requestData.assigned_to).single();
        if (assignee?.email) {
          sendEmail(assignee.email, `You've been assigned: ${request_id}`, 'assignment', {
            ...data,
            assigned_name: assignee.name,
            token: action_token,
          });
        }
      }

      return { request: data };
    },

    update: async (id: number, requestData: any) => {
      const { data: existing } = await supabase.from('requests').select('*').eq('id', id).single();
      if (!existing) throw new Error('Request not found');

      const updateData: any = {};
      if (requestData.title !== undefined) updateData.title = requestData.title;
      if (requestData.requester_name !== undefined) updateData.requester_name = requestData.requester_name;
      if (requestData.requester_email !== undefined) updateData.requester_email = requestData.requester_email;
      if (requestData.department !== undefined) updateData.department = requestData.department;
      if (requestData.category !== undefined) updateData.category = requestData.category;
      if (requestData.urgency !== undefined) updateData.urgency = requestData.urgency;
      if (requestData.description !== undefined) updateData.description = requestData.description;
      if (requestData.remarks !== undefined) updateData.remarks = requestData.remarks;
      if (requestData.assigned_to !== undefined) updateData.assigned_to = requestData.assigned_to || null;
      if (requestData.status !== undefined) updateData.status = requestData.status;

      // Generate new token if not exists
      if (!existing.action_token) {
        updateData.action_token = generateToken();
      }

      if (requestData.due_date !== undefined) updateData.due_date = requestData.due_date || null;

      const { data, error } = await supabase.from('requests').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const token = data.action_token || existing.action_token;

      // Get status history for email
      const { data: historyLogs } = await supabase
        .from('activity_logs')
        .select('action, details, timestamp')
        .eq('request_id', id)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (requestData.status && requestData.status !== existing.status) {
        await logActivity(id, 'Status Changed', user?.email || 'System', `Status changed from ${existing.status} to ${requestData.status}`);

        // Send email to requester
        if (existing.requester_email) {
          const emailType = requestData.status === 'Completed' ? 'completed' : requestData.status === 'Pending Info' ? 'pending_info' : 'status_change';
          sendEmail(existing.requester_email, `${requestData.status === 'Completed' ? '✅ Completed' : requestData.status === 'Pending Info' ? '⚠️ Action Needed' : '📊 Update'}: ${existing.request_id}`, emailType, {
            request_id: existing.request_id,
            title: existing.title,
            old_status: existing.status,
            new_status: requestData.status,
            remarks: requestData.remarks || data.remarks || '',
            history: historyLogs || [],
            token,
          });
        }
      }

      if (requestData.assigned_to && requestData.assigned_to !== existing.assigned_to) {
        const { data: assignee } = await supabase.from('users').select('name, email').eq('id', requestData.assigned_to).single();
        await logActivity(id, 'Request Assigned', user?.email || 'System', `Assigned to ${assignee?.name || 'Unknown'}`);

        if (assignee?.email) {
          sendEmail(assignee.email, `New Assignment: ${existing.request_id}`, 'assignment', {
            ...data,
            assigned_name: assignee.name,
            token,
          });
        }

        // Notify old assignee if changed
        if (existing.assigned_to) {
          const { data: oldAssignee } = await supabase.from('users').select('name, email').eq('id', existing.assigned_to).single();
          if (oldAssignee?.email) {
            sendEmail(oldAssignee.email, `Assignment Changed: ${existing.request_id}`, 'reassigned', {
              request_id: existing.request_id,
              title: existing.title,
              old_name: oldAssignee.name,
              token,
            });
          }
        }
      }

      await logActivity(id, 'Request Updated', user?.email || 'System', 'Request details updated');
      return { request: data };
    },

    delete: async (id: number) => {
      const { data: request } = await supabase.from('requests').select('request_id').eq('id', id).single();
      const { error } = await supabase.from('requests').delete().eq('id', id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await logActivity(null, 'Request Deleted', user?.email || 'System', `Request ${request?.request_id} deleted`);
      return { message: 'Request deleted' };
    },
  },

  activities: {
    list: async (params: Record<string, any> = {}) => {
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { activities: data || [], total: count || 0, page, limit };
    },
  },

  projects: {
    generateId: async () => {
      const { data } = await supabase.from('projects').select('project_id').order('id', { ascending: false }).limit(1).single();
      if (!data) return 'PRJ-0001';
      const num = parseInt(data.project_id.replace('PRJ-', '')) + 1;
      return `PRJ-${String(num).padStart(4, '0')}`;
    },

    list: async (params: Record<string, any> = {}) => {
      let query = supabase
        .from('projects')
        .select('*, users!owner_id(name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params.status) query = query.eq('status', params.status);
      if (params.search) query = query.or(`title.ilike.%${params.search}%,project_id.ilike.%${params.search}%`);

      const { data, count, error } = await query;
      if (error) throw error;

      // Get member counts
      const projects = (data || []).map((p: any) => ({
        ...p,
        owner_name: p.users?.name || null,
        users: undefined,
      }));

      return { projects, total: count || 0 };
    },

    get: async (id: number) => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*, users!owner_id(name)')
        .eq('id', id)
        .single();
      if (error) throw error;

      const [{ data: members }, { data: milestones }, { data: tasks }, { data: notes }] = await Promise.all([
        supabase.from('project_members').select('*, users(name, email)').eq('project_id', id),
        supabase.from('project_milestones').select('*').eq('project_id', id).order('sort_order'),
        supabase.from('project_tasks').select('*, users(name), project_milestones(title)').eq('project_id', id).order('sort_order'),
        supabase.from('project_notes').select('*, users(name)').eq('project_id', id).order('created_at', { ascending: false }),
      ]);

      return {
        project: { ...project, owner_name: project?.users?.name || null, users: undefined },
        members: members || [],
        milestones: milestones || [],
        tasks: (tasks || []).map((t: any) => ({ ...t, assigned_name: t.users?.name || null, milestone_title: t.project_milestones?.title || null, users: undefined, project_milestones: undefined })),
        notes: (notes || []).map((n: any) => ({ ...n, user_name: n.users?.name || null, users: undefined })),
      };
    },

    create: async (data: any) => {
      const project_id = await api.projects.generateId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: project, error } = await supabase.from('projects').insert({
        project_id,
        title: data.title,
        description: data.description || '',
        owner_id: data.owner_id || user?.id,
        status: data.status || 'Planning',
        start_date: data.start_date || null,
        due_date: data.due_date || null,
        progress: data.progress || 0,
      }).select().single();
      if (error) throw error;

      // Add owner as member
      if (project.owner_id) {
        await supabase.from('project_members').insert({ project_id: project.id, user_id: project.owner_id, role: 'owner' });
      }

      // Add team members
      if (data.member_ids && data.member_ids.length > 0) {
        const memberInserts = data.member_ids.map((uid: string) => ({ project_id: project.id, user_id: uid, role: 'member' }));
        await supabase.from('project_members').insert(memberInserts);
      }

      await logActivity(null, 'Project Created', user?.email || 'System', `Project ${project_id}: ${data.title}`);
      return { project };
    },

    update: async (id: number, data: any) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.owner_id !== undefined) updateData.owner_id = data.owner_id;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.start_date !== undefined) updateData.start_date = data.start_date || null;
      if (data.due_date !== undefined) updateData.due_date = data.due_date || null;
      if (data.progress !== undefined) updateData.progress = data.progress;

      const { data: project, error } = await supabase.from('projects').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await logActivity(null, 'Project Updated', user?.email || 'System', `Project ${project.project_id} updated`);
      return { project };
    },

    delete: async (id: number) => {
      const { data: project } = await supabase.from('projects').select('project_id').eq('id', id).single();
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await logActivity(null, 'Project Deleted', user?.email || 'System', `Project ${project?.project_id} deleted`);
      return { message: 'Project deleted' };
    },

    // Milestones
    addMilestone: async (projectId: number, data: any) => {
      const { data: milestone, error } = await supabase.from('project_milestones').insert({
        project_id: projectId, title: data.title, description: data.description || '', due_date: data.due_date || null, sort_order: data.sort_order || 0,
      }).select().single();
      if (error) throw error;
      return { milestone };
    },

    updateMilestone: async (id: number, data: any) => {
      const { data: milestone, error } = await supabase.from('project_milestones').update(data).eq('id', id).select().single();
      if (error) throw error;
      return { milestone };
    },

    deleteMilestone: async (id: number) => {
      const { error } = await supabase.from('project_milestones').delete().eq('id', id);
      if (error) throw error;
      return { message: 'Milestone deleted' };
    },

    // Tasks
    addTask: async (projectId: number, data: any) => {
      const { data: task, error } = await supabase.from('project_tasks').insert({
        project_id: projectId, milestone_id: data.milestone_id || null, title: data.title, description: data.description || '',
        assigned_to: data.assigned_to || null, status: data.status || 'Todo', priority: data.priority || 'Normal', due_date: data.due_date || null, sort_order: data.sort_order || 0,
      }).select().single();
      if (error) throw error;
      return { task };
    },

    updateTask: async (id: number, data: any) => {
      const { data: task, error } = await supabase.from('project_tasks').update(data).eq('id', id).select().single();
      if (error) throw error;
      return { task };
    },

    deleteTask: async (id: number) => {
      const { error } = await supabase.from('project_tasks').delete().eq('id', id);
      if (error) throw error;
      return { message: 'Task deleted' };
    },

    // Members
    addMember: async (projectId: number, userId: string) => {
      const { data, error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: userId }).select().single();
      if (error) throw error;
      return { member: data };
    },

    removeMember: async (projectId: number, userId: string) => {
      const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId);
      if (error) throw error;
      return { message: 'Member removed' };
    },

    // Notes
    addNote: async (projectId: number, note: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('project_notes').insert({ project_id: projectId, user_id: user?.id, note }).select('*, users(name)').single();
      if (error) throw error;
      return { note: { ...data, user_name: data?.users?.name || null, users: undefined } };
    },

    deleteNote: async (id: number) => {
      const { error } = await supabase.from('project_notes').delete().eq('id', id);
      if (error) throw error;
      return { message: 'Note deleted' };
    },
  },
};
