import { supabase } from '../lib/supabase';
import { isHoliday } from '../config/public-holidays';

// --- SLA Helpers ---
const SLA_WORKING_DAYS: Record<string, number> = {
  Normal: 3,
  Urgent: 1,
  Critical: 0, // same working day
};

const PAUSED_STATUSES = ['Pending Info', 'Pending Content', 'Pending Approval', 'Pending Vendor'];

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Adjusts a date to the effective working day start based on office hours.
 * Office hours: Mon–Thu 8:30 AM – 5:00 PM, Fri 8:30 AM – 12:30 PM.
 * Requests submitted outside office hours are treated as received on the next working day.
 */
function getEffectiveStartDate(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const hour = result.getHours();
  const minute = result.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Helper: set to 8:30 AM
  const setToMorning = (date: Date) => {
    date.setHours(8, 30, 0, 0);
    return date;
  };

  // Helper: advance to next day at 8:30 AM, skipping weekends and holidays
  const advanceToNextWorkingDay = (date: Date) => {
    date.setDate(date.getDate() + 1);
    while (isWeekend(date) || isHoliday(date)) {
      date.setDate(date.getDate() + 1);
    }
    return setToMorning(date);
  };

  // Weekend or holiday → next working day
  if (isWeekend(result) || isHoliday(result)) {
    return advanceToNextWorkingDay(result);
  }

  // Before office hours (before 8:30 AM)
  if (timeInMinutes < 8 * 60 + 30) {
    return setToMorning(result);
  }

  // Friday after 12:30 PM → next Monday (or next working day)
  if (day === 5 && timeInMinutes >= 12 * 60 + 30) {
    return advanceToNextWorkingDay(result);
  }

  // Mon–Thu after 5:00 PM → next working day
  if (day >= 1 && day <= 4 && timeInMinutes >= 17 * 60) {
    return advanceToNextWorkingDay(result);
  }

  // During office hours — return as-is
  return result;
}

function addWorkingDays(start: Date, days: number): Date {
  const result = new Date(start);
  if (days === 0) return result; // same day for Critical
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result) && !isHoliday(result)) added++;
  }
  return result;
}

/**
 * Parse a date string to local midnight, avoiding UTC timezone shift.
 * "2026-06-16" and ISO timestamps both produce June 16 at local midnight.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

function workingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const target = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (current < target) {
    current.setDate(current.getDate() + 1);
    if (!isWeekend(current) && !isHoliday(current)) count++;
  }
  return count;
}

function calculateSlaDueDate(createdAt: string, urgency: string, pausedDays: number = 0): string {
  const created = new Date(createdAt);
  const slaDays = SLA_WORKING_DAYS[urgency] ?? 3;
  // Adjust for office hours — requests outside office hours start next working day
  const effectiveStart = getEffectiveStartDate(created);
  // Add back paused days as working days to shift the start forward
  let shiftedStart = effectiveStart;
  if (pausedDays > 0) {
    shiftedStart = addWorkingDays(effectiveStart, pausedDays);
  }
  const dueDate = addWorkingDays(shiftedStart, slaDays);
  return dueDate.toISOString().split('T')[0];
}

function calculateSlaStatus(slaDueDate: string | null, status: string, pausedAt: string | null): string {
  if (PAUSED_STATUSES.includes(status) || pausedAt) return 'Paused';
  if (status === 'Completed') return 'Within SLA';
  if (!slaDueDate) return 'Within SLA';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseLocalDate(slaDueDate);
  const diffDays = workingDaysBetween(today, due);
  const diffNegative = workingDaysBetween(due, today);

  if (today > due && diffNegative > 0) return 'Overdue';
  if (diffDays <= 1 && diffDays >= 0) return 'Approaching SLA';
  return 'Within SLA';
}

// --- Existing helpers ---

// --- Project Health & Progress ---
function calculateProjectHealth(project: any, tasks: any[] = [], milestones: any[] = []): string {
  if (project.status === 'Completed') return 'Completed';
  if (project.status === 'Cancelled') return 'Delayed';

  // Check if overdue
  if (project.due_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(project.due_date);
    if (today > due) return 'Delayed';
  }

  // Check timeline vs progress
  if (project.start_date && project.due_date) {
    const start = new Date(project.start_date);
    const due = new Date(project.due_date);
    const today = new Date();
    const totalDays = (due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (totalDays > 0) {
      const timelinePercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      const progress = project.progress || 0;

      // At Risk: >80% timeline consumed but <50% progress
      if (timelinePercent > 80 && progress < 50) return 'At Risk';
    }
  }

  return 'On Track';
}

function calculateProjectProgress(tasks: any[], milestones: any[]): number {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const totalMilestones = milestones.length;

  if (totalTasks === 0 && totalMilestones === 0) return 0;

  // If milestones have weights, use weight-based progress
  const hasWeights = milestones.some(m => m.weight && m.weight > 0);
  if (hasWeights && totalMilestones > 0) {
    const completedWeight = milestones
      .filter(m => m.completed)
      .reduce((sum, m) => sum + (m.weight || 0), 0);
    return Math.min(100, completedWeight);
  }

  // Fallback: no weights — use simple count-based
  const doneMilestones = milestones.filter(m => m.completed).length;
  const taskPercent = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
  const milestonePercent = totalMilestones > 0 ? (doneMilestones / totalMilestones) * 100 : 0;

  if (totalMilestones > 0) {
    return Math.round(milestonePercent * 0.5 + taskPercent * 0.5);
  }

  // Tasks only: if all done, cap at 95%
  if (totalTasks > 0 && doneTasks === totalTasks) return 95;
  return Math.round(taskPercent);
}

// --- Existing helpers ---
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
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Email send failed (${res.status}):`, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email send error:', err);
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
        .neq('role', 'guest')
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
      if (params.assignedTo) {
        query = query.eq('assigned_to', params.assignedTo);
      }
      if (params.slaStatus) {
        query = query.eq('sla_status', params.slaStatus);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      const requests = (data || []).map((r: any) => {
        // Always dynamically compute sla_due_date from current urgency
        const effectiveDueDate = r.created_at
          ? calculateSlaDueDate(r.created_at, r.urgency || 'Normal', r.sla_paused_days || 0)
          : r.sla_due_date || null;

        // Recalculate SLA status dynamically
        const slaStatus = effectiveDueDate
          ? calculateSlaStatus(effectiveDueDate, r.status, r.sla_paused_at || null)
          : r.sla_status || 'Within SLA';

        // Calculate days remaining or overdue
        let daysRemaining = null;
        let overdueDays = null;
        if (effectiveDueDate && r.status !== 'Completed') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = parseLocalDate(effectiveDueDate);
          if (today <= due) {
            daysRemaining = workingDaysBetween(today, due);
          } else {
            overdueDays = workingDaysBetween(due, today);
          }
        }

        return {
          ...r,
          assigned_name: r.users?.name || null,
          sla_due_date: effectiveDueDate,
          sla_status: slaStatus,
          sla_days_remaining: daysRemaining,
          sla_overdue_days: overdueDays,
          users: undefined,
        };
      });

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

      // SLA stats — compute dynamically from current urgency
      const activeRequests = requests.filter(r => r.status !== 'Completed');
      const slaCounts = { withinSLA: 0, approachingSLA: 0, overdueSLA: 0, paused: 0 };
      for (const r of activeRequests) {
        const effectiveDueDate = r.created_at
          ? calculateSlaDueDate(r.created_at, r.urgency || 'Normal', r.sla_paused_days || 0)
          : r.sla_due_date || null;
        const slaSt = effectiveDueDate
          ? calculateSlaStatus(effectiveDueDate, r.status, r.sla_paused_at || null)
          : 'Within SLA';
        if (slaSt === 'Overdue') slaCounts.overdueSLA++;
        else if (slaSt === 'Approaching SLA') slaCounts.approachingSLA++;
        else if (slaSt === 'Paused') slaCounts.paused++;
        else slaCounts.withinSLA++;
      }
      const totalActive = activeRequests.length;
      const slaCompliance = totalActive > 0
        ? Math.round(((totalActive - slaCounts.overdueSLA) / totalActive) * 100)
        : 100;

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

      // Follow-up / duplicate detection: flag requests from the same email with same title or thread reply
      const normalizeTitle = (t: string) => t.replace(/^(Re|Fw|Fwd):\s*/gi, '').trim().toLowerCase();
      const detectDuplicate = (req: any): string | null => {
        if (!req.requester_email) return null;
        // Already linked — skip auto-detection
        if (req.related_request_id) return null;
        const reqTitle = normalizeTitle(req.title || '');
        const reqCreated = new Date(req.created_at).getTime();
        const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;
        const isThreadReply = req.remarks && req.remarks.includes('thread reply');
        const earlier = requests.find((r: any) => {
          if (r.id === req.id) return false;
          if (r.requester_email !== req.requester_email) return false;
          const rCreated = new Date(r.created_at).getTime();
          if (rCreated >= reqCreated) return false;
          if (normalizeTitle(r.title || '') === reqTitle && reqTitle.length > 0) return true;
          if (isThreadReply) return true;
          if ((reqCreated - rCreated) <= DUPLICATE_WINDOW_MS) return true;
          return false;
        });
        return earlier ? earlier.request_id : null;
      };

      const { data: unassignedRequests } = await supabase
        .from('requests')
        .select('*')
        .is('assigned_to', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const now = new Date();
      const unassignedWithDays = (unassignedRequests || []).map((r: any) => {
        const created = new Date(r.created_at);
        const daysUnassigned = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return { ...r, days_unassigned: daysUnassigned };
      });

      // Get project stats
      const { data: allProjects } = await supabase.from('projects').select('id, project_id, title, status, progress, start_date, due_date, created_at');
      const projects = allProjects || [];
      const now2 = new Date();
      now2.setHours(0, 0, 0, 0);
      const projectStats = {
        total: projects.length,
        active: projects.filter((p: any) => p.status === 'Active').length,
        planning: projects.filter((p: any) => p.status === 'Planning').length,
        completed: projects.filter((p: any) => p.status === 'Completed').length,
        delayed: projects.filter((p: any) => {
          if (p.status === 'Completed' || p.status === 'Cancelled') return false;
          if (p.due_date && new Date(p.due_date) < now2) return true;
          return false;
        }).length,
      };

      // Enrich recent projects with health + computed progress
      const recentProjectsEnriched = await Promise.all(projects.slice(0, 5).map(async (p: any) => {
        const { data: pTasks } = await supabase.from('project_tasks').select('status').eq('project_id', p.id);
        const { data: pMilestones } = await supabase.from('project_milestones').select('completed, weight').eq('project_id', p.id);
        const computedProgress = calculateProjectProgress(pTasks || [], pMilestones || []);
        const health = calculateProjectHealth({ ...p, progress: computedProgress }, pTasks || [], pMilestones || []);
        return { ...p, progress: computedProgress, health };
      }));

      // Get current user's assigned requests
      const { data: { user } } = await supabase.auth.getUser();
      let myRequests: any[] = [];
      let myStats = { assigned: 0, active: 0, overdue: 0, completed: 0 };
      if (user) {
        const { data: myReqs } = await supabase
          .from('requests')
          .select('*, users!assigned_to(name)')
          .eq('assigned_to', user.id)
          .neq('status', 'Completed')
          .order('updated_at', { ascending: false })
          .limit(10);

        myRequests = (myReqs || []).map((r: any) => ({
          ...r,
          assigned_name: r.users?.name || null,
          users: undefined,
          sla_status: r.sla_due_date
            ? calculateSlaStatus(r.sla_due_date, r.status, r.sla_paused_at || null)
            : 'Within SLA',
        }));

        const allMyReqs = requests.filter((r: any) => r.assigned_to === user.id);
        const activeMy = allMyReqs.filter((r: any) => r.status !== 'Completed');
        let overdueCount = 0;
        for (const r of activeMy) {
          const slaSt = r.sla_due_date
            ? calculateSlaStatus(r.sla_due_date, r.status, r.sla_paused_at || null)
            : 'Within SLA';
          if (slaSt === 'Overdue') overdueCount++;
        }
        myStats = {
          assigned: allMyReqs.length,
          active: activeMy.length,
          overdue: overdueCount,
          completed: allMyReqs.filter((r: any) => r.status === 'Completed').length,
        };
      }

      // Enrich recent and unassigned with duplicate flag
      const recentEnriched = recent.map((r: any) => ({
        ...r,
        possible_duplicate_of: detectDuplicate(r),
      }));

      const unassignedEnriched = unassignedWithDays.map((r: any) => ({
        ...r,
        possible_duplicate_of: detectDuplicate(r),
      }));

      return {
        stats: {
          ...stats,
          escalated: unassignedEnriched.filter((r: any) => r.days_unassigned >= 3).length,
        },
        slaStats: {
          withinSLA: slaCounts.withinSLA,
          approachingSLA: slaCounts.approachingSLA,
          overdueSLA: slaCounts.overdueSLA,
          paused: slaCounts.paused,
          compliance: slaCompliance,
        },
        recentRequests: recentEnriched,
        unassignedRequests: unassignedEnriched,
        projectStats,
        recentProjects: recentProjectsEnriched,
        myRequests,
        myStats,
      };
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

      // Always dynamically compute sla_due_date from current urgency (never trust stale stored values)
      const effectiveDueDate = request?.created_at
        ? calculateSlaDueDate(request.created_at, request?.urgency || 'Normal', request?.sla_paused_days || 0)
        : request?.sla_due_date || null;

      // Enrich with dynamic SLA calculation (mirrors requests.list pattern)
      const slaStatus = effectiveDueDate
        ? calculateSlaStatus(effectiveDueDate, request.status, request.sla_paused_at || null)
        : 'Within SLA';

      let slaDaysRemaining: number | null = null;
      let slaOverdueDays: number | null = null;
      let slaTurnaround: 'Met' | 'Missed' | null = null;
      let slaTurnaroundDays: number | null = null;

      if (effectiveDueDate && request.status !== 'Completed') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = parseLocalDate(effectiveDueDate);
        if (today <= due) {
          slaDaysRemaining = workingDaysBetween(today, due);
        } else {
          slaOverdueDays = workingDaysBetween(due, today);
        }
      }

      // SLA turnaround for completed requests: was it completed before or after due date?
      if (request?.status === 'Completed' && effectiveDueDate) {
        const completedAt = parseLocalDate(request.updated_at);
        const due = parseLocalDate(effectiveDueDate);
        if (completedAt <= due) {
          slaTurnaround = 'Met';
          slaTurnaroundDays = workingDaysBetween(completedAt, due);
        } else {
          slaTurnaround = 'Missed';
          slaTurnaroundDays = workingDaysBetween(due, completedAt);
        }
      }

      return {
        request: {
          ...request,
          assigned_name: request?.users?.name || null,
          users: undefined,
          sla_due_date: effectiveDueDate,
          sla_status: slaStatus,
          sla_days_remaining: slaDaysRemaining,
          sla_overdue_days: slaOverdueDays,
          sla_turnaround: slaTurnaround,
          sla_turnaround_days: slaTurnaroundDays,
        },
        activities: activities || [],
      };
    },

    // Lightweight search for linking dropdown
    searchForLinking: async (query: string, excludeId?: number) => {
      let q = supabase
        .from('requests')
        .select('id, request_id, title, requester_name, status')
        .or(`request_id.ilike.%${query}%,title.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q;
      return data || [];
    },

    create: async (requestData: any) => {
      const request_id = await generateRequestId();
      const action_token = generateToken();
      const now = new Date().toISOString();
      const urgency = requestData.urgency || 'Normal';
      const slaDueDate = calculateSlaDueDate(now, urgency, 0);

      const { data, error } = await supabase.from('requests').insert({
        request_id,
        title: requestData.title,
        requester_name: requestData.requester_name,
        requester_email: requestData.requester_email || '',
        department: requestData.department || '',
        category: requestData.category || '',
        urgency,
        description: requestData.description || '',
        assigned_to: requestData.assigned_to || null,
        status: requestData.status || 'New',
        remarks: requestData.remarks || '',
        due_date: requestData.due_date || null,
        action_token,
        sla_due_date: slaDueDate,
        sla_status: 'Within SLA',
        sla_paused_days: 0,
        sla_paused_at: null,
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

      // Send confirmation email to requester
      if (requestData.requester_email) {
        sendEmail(requestData.requester_email, `Request Received: ${request_id} — ${requestData.title}`, 'request_received', {
          request_id,
          title: requestData.title,
          requester_name: requestData.requester_name || requestData.requester_email.split('@')[0],
          department: requestData.department || '',
          urgency: requestData.urgency || 'Normal',
          description: requestData.description || '',
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
      if (requestData.related_request_id !== undefined) updateData.related_request_id = requestData.related_request_id || null;

      // --- SLA Pause/Resume Logic ---
      if (requestData.status !== undefined && requestData.status !== existing.status) {
        const newStatus = requestData.status;
        const oldStatus = existing.status;
        const pausedDays = existing.sla_paused_days || 0;

        if (PAUSED_STATUSES.includes(newStatus) && !existing.sla_paused_at) {
          // Pause SLA: record when we paused
          updateData.sla_paused_at = new Date().toISOString();
          updateData.sla_status = 'Paused';
          await logActivity(id, 'SLA Paused', 'System', `SLA paused — status changed to ${newStatus}`);
        } else if (!PAUSED_STATUSES.includes(newStatus) && existing.sla_paused_at) {
          // Resume SLA: calculate paused working days and shift due date
          const pausedAt = new Date(existing.sla_paused_at);
          const resumeAt = new Date();
          const pauseDuration = workingDaysBetween(pausedAt, resumeAt);
          const newPausedDays = pausedDays + pauseDuration;
          const urgency = requestData.urgency || existing.urgency || 'Normal';
          const newSlaDue = calculateSlaDueDate(existing.created_at, urgency, newPausedDays);
          const newSlaStatus = calculateSlaStatus(newSlaDue, newStatus, null);

          updateData.sla_paused_at = null;
          updateData.sla_paused_days = newPausedDays;
          updateData.sla_due_date = newSlaDue;
          updateData.sla_status = newSlaStatus;
          await logActivity(id, 'SLA Resumed', 'System', `SLA resumed — ${pauseDuration} working day(s) paused`);
        } else if (newStatus === 'Completed') {
          // On completion, clear any active pause and set final status
          if (existing.sla_paused_at) {
            updateData.sla_paused_at = null;
          }
          updateData.sla_status = 'Within SLA'; // Completed within SLA
        } else {
          // Regular status change (not pause/resume) — recalculate SLA status
          const urgency = requestData.urgency || existing.urgency || 'Normal';
          const slaDue = calculateSlaDueDate(existing.created_at, urgency, pausedDays);
          updateData.sla_due_date = slaDue;
          updateData.sla_status = calculateSlaStatus(slaDue, newStatus, existing.sla_paused_at || null);
        }
      }

      // Recalculate SLA if urgency changed
      if (requestData.urgency !== undefined && requestData.urgency !== existing.urgency && !updateData.sla_due_date) {
        const pausedDays = existing.sla_paused_days || 0;
        const newSlaDue = calculateSlaDueDate(existing.created_at, requestData.urgency, pausedDays);
        updateData.sla_due_date = newSlaDue;
        updateData.sla_status = calculateSlaStatus(newSlaDue, existing.status, existing.sla_paused_at || null);
      }

      const { data, error } = await supabase.from('requests').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const token = data.action_token || existing.action_token;

      // Log related request changes
      if (requestData.related_request_id !== undefined && requestData.related_request_id !== existing.related_request_id) {
        if (requestData.related_request_id) {
          await logActivity(id, 'Linked', user?.email || 'System', `Linked to another request`);
        } else {
          await logActivity(id, 'Unlinked', user?.email || 'System', 'Removed link to related request');
        }
      }

      // Get status history for email
      const { data: historyLogs } = await supabase
        .from('activity_logs')
        .select('action, details, timestamp')
        .eq('request_id', id)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (requestData.status && requestData.status !== existing.status) {
        await logActivity(id, 'Status Changed', user?.email || 'System', `Status changed from ${existing.status} to ${requestData.status}`);

        const emailType = requestData.status === 'Completed' ? 'completed' : requestData.status === 'Pending Info' ? 'pending_info' : 'status_change';
        const emailSubject = `${requestData.status === 'Completed' ? '✅ Completed' : requestData.status === 'Pending Info' ? '⚠️ Action Needed' : '📊 Update'}: ${existing.request_id}`;
        const emailData = {
          request_id: existing.request_id,
          title: existing.title,
          old_status: existing.status,
          new_status: requestData.status,
          remarks: requestData.remarks || data.remarks || '',
          history: historyLogs || [],
          token,
        };

        // Send email to requester
        if (existing.requester_email) {
          const sent = await sendEmail(existing.requester_email, emailSubject, emailType, emailData);
          if (!sent) {
            console.warn(`Failed to send ${emailType} email to requester ${existing.requester_email}`);
          } else {
            console.log(`Email sent to requester: ${existing.requester_email}`);
          }
        } else {
          console.warn('No requester_email set — skipping requester email');
        }

        // Also send completion/status emails to admins
        if (requestData.status === 'Completed' || requestData.status === 'Pending Info') {
          const adminEmails = await getAdminEmails();
          const filteredAdmins = adminEmails.filter(e => e !== existing.requester_email);
          if (filteredAdmins.length > 0) {
            const adminSent = await sendEmail(filteredAdmins, emailSubject, emailType, emailData);
            if (adminSent) {
              console.log(`Email sent to admins: ${filteredAdmins.join(', ')}`);
            }
          }
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

    claim: async (id: number) => {
      const { data: existing } = await supabase.from('requests').select('*').eq('id', id).single();
      if (!existing) throw new Error('Request not found');
      if (existing.assigned_to) throw new Error('This request is already assigned');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('requests')
        .update({ assigned_to: user.id, status: 'In Progress' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logActivity(id, 'Request Claimed', user.email || 'System', `Self-assigned by ${user.email}`);

      // Notify admins that a staff member claimed this job
      const { data: claimer } = await supabase.from('users').select('name, email').eq('id', user.id).single();
      const adminEmails = await getAdminEmails();
      if (adminEmails.length > 0) {
        sendEmail(adminEmails, `Job Claimed: ${existing.request_id} — ${existing.title}`, 'claimed', {
          request_id: existing.request_id,
          title: existing.title,
          requester_name: existing.requester_name,
          assigned_name: claimer?.name || user.email,
          urgency: existing.urgency,
          token: existing.action_token,
        });
      }

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

      // Get member counts & compute health + progress per project
      const projects = await Promise.all((data || []).map(async (p: any) => {
        const { data: pTasks } = await supabase.from('project_tasks').select('status').eq('project_id', p.id);
        const { data: pMilestones } = await supabase.from('project_milestones').select('completed, weight').eq('project_id', p.id);
        const tasksArr = pTasks || [];
        const msArr = pMilestones || [];
        const computedProgress = calculateProjectProgress(tasksArr, msArr);
        const health = calculateProjectHealth({ ...p, progress: computedProgress }, tasksArr, msArr);
        return {
          ...p,
          owner_name: p.users?.name || null,
          health,
          progress: computedProgress,
          users: undefined,
        };
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

      // Compute health and progress using tasks + milestones
      const computedProgress = calculateProjectProgress(tasks || [], milestones || []);
      const health = calculateProjectHealth({ ...project, progress: computedProgress }, tasks || [], milestones || []);

      return {
        project: { ...project, owner_name: project?.users?.name || null, health, progress: computedProgress, users: undefined },
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

      // Create default 5-phase milestones with preset weights
      const defaultPhases = [
        { title: 'Phase 1 — Planning', weight: 10, sort_order: 1 },
        { title: 'Phase 2 — Design', weight: 20, sort_order: 2 },
        { title: 'Phase 3 — Development', weight: 30, sort_order: 3 },
        { title: 'Phase 4 — Testing', weight: 20, sort_order: 4 },
        { title: 'Phase 5 — Deployment', weight: 20, sort_order: 5 },
      ];
      await supabase.from('project_milestones').insert(
        defaultPhases.map(p => ({ project_id: project.id, ...p }))
      );

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
        project_id: projectId, title: data.title, description: data.description || '', due_date: data.due_date || null,
        sort_order: data.sort_order || 0, weight: data.weight ?? 0,
      }).select().single();
      if (error) throw error;
      return { milestone };
    },

    updateMilestone: async (id: number, data: any) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.due_date !== undefined) updateData.due_date = data.due_date || null;
      if (data.completed !== undefined) updateData.completed = data.completed;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
      const { data: milestone, error } = await supabase.from('project_milestones').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      // Auto-recalculate and persist project progress when milestone completion or weight changes
      if (data.completed !== undefined || data.weight !== undefined) {
        const projectId = milestone.project_id;
        const [{ data: pTasks }, { data: pMilestones }] = await Promise.all([
          supabase.from('project_tasks').select('status').eq('project_id', projectId),
          supabase.from('project_milestones').select('completed, weight').eq('project_id', projectId),
        ]);
        const newProgress = calculateProjectProgress(pTasks || [], pMilestones || []);
        await supabase.from('projects').update({ progress: newProgress }).eq('id', projectId);
      }

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

      // Auto-recalculate and persist project progress when task status changes
      if (data.status !== undefined && task) {
        const projectId = task.project_id;
        const [{ data: pTasks }, { data: pMilestones }] = await Promise.all([
          supabase.from('project_tasks').select('status').eq('project_id', projectId),
          supabase.from('project_milestones').select('completed, weight').eq('project_id', projectId),
        ]);
        const newProgress = calculateProjectProgress(pTasks || [], pMilestones || []);
        await supabase.from('projects').update({ progress: newProgress }).eq('id', projectId);
      }

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
    addNote: async (projectId: number, note: string, category: string = 'General') => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('project_notes').insert({ project_id: projectId, user_id: user?.id, note, category }).select('*, users(name)').single();
      if (error) throw error;
      return { note: { ...data, user_name: data?.users?.name || null, users: undefined } };
    },

    deleteNote: async (id: number) => {
      const { error } = await supabase.from('project_notes').delete().eq('id', id);
      if (error) throw error;
      return { message: 'Note deleted' };
    },
  },

  insights: {
    fetchAll: async () => {
      const [
        { data: allRequests },
        { data: allProjects },
        { data: allUsers },
        { data: allTasks },
        { data: allMilestones },
      ] = await Promise.all([
        supabase.from('requests').select('*, users!assigned_to(name)').order('created_at'),
        supabase.from('projects').select('*, users!owner_id(name)'),
        supabase.from('users').select('id, name, email, role, department').eq('status', 'active').neq('role', 'guest'),
        supabase.from('project_tasks').select('project_id, status, assigned_to'),
        supabase.from('project_milestones').select('project_id, completed, weight'),
      ]);

      // Group tasks/milestones by project_id
      const tasksByProject = new Map<number, any[]>();
      (allTasks || []).forEach((t: any) => {
        const arr = tasksByProject.get(t.project_id) || [];
        arr.push(t);
        tasksByProject.set(t.project_id, arr);
      });
      const msByProject = new Map<number, any[]>();
      (allMilestones || []).forEach((m: any) => {
        const arr = msByProject.get(m.project_id) || [];
        arr.push(m);
        msByProject.set(m.project_id, arr);
      });

      // Enrich requests with dynamic SLA status
      const now = new Date();
      const requests = (allRequests || []).map((r: any) => {
        const slaStatus = r.sla_due_date
          ? calculateSlaStatus(r.sla_due_date, r.status, r.sla_paused_at || null)
          : 'Within SLA';
        const created = new Date(r.created_at);
        const daysUnassigned = r.assigned_to ? 0 : Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...r,
          assigned_name: r.users?.name || null,
          sla_status: slaStatus,
          days_unassigned: daysUnassigned,
          users: undefined,
        };
      });

      // Enrich projects with health + progress
      const projects = (allProjects || []).map((p: any) => {
        const tasks = tasksByProject.get(p.id) || [];
        const ms = msByProject.get(p.id) || [];
        const progress = calculateProjectProgress(tasks, ms);
        const health = calculateProjectHealth({ ...p, progress }, tasks, ms);
        return { ...p, owner_name: p.users?.name || null, progress, health, users: undefined };
      });

      return { requests, projects, users: allUsers || [] };
    },
  },
};

// Export SLA utilities for use in components (e.g., RequestDetail)
export const slaUtils = {
  workingDaysBetween,
  isWeekend,
  isHoliday,
  getEffectiveStartDate,
  addWorkingDays,
  calculateSlaDueDate,
  calculateSlaStatus,
  PAUSED_STATUSES,
};
