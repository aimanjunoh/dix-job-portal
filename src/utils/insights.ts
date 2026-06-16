import type {
  EnrichedRequest, EnrichedProject, UserRecord,
  RequestStats, CategoryBucket, MonthlyBucket,
  SlaStats, MonthlySlaBucket, ProjectStats, StaffWorkload, ManagementSummary
} from '../types/insights';

// --- Helpers ---
function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function workingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const target = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (current < target) {
    current.setDate(current.getDate() + 1);
    if (!isWeekend(current)) count++;
  }
  return count;
}

function getMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

// --- Section 1: Request Insights ---
export function computeRequestStats(requests: EnrichedRequest[]): RequestStats {
  return {
    total: requests.length,
    completed: requests.filter(r => r.status === 'Completed').length,
    pending: requests.filter(r => r.status === 'Pending Info').length,
    overdue: requests.filter(r => r.sla_status === 'Overdue').length,
    escalated: requests.filter(r => !r.assigned_to && (r.days_unassigned || 0) >= 3).length,
  };
}

export function groupByMonth(requests: EnrichedRequest[]): MonthlyBucket[] {
  const map = new Map<string, number>();
  requests.forEach(r => {
    const month = getMonth(r.created_at);
    map.set(month, (map.get(month) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month: getMonthLabel(month), count }));
}

export function groupByField(requests: EnrichedRequest[], field: keyof EnrichedRequest): CategoryBucket[] {
  const map = new Map<string, number>();
  requests.forEach(r => {
    const val = String(r[field] || 'Unknown');
    map.set(val, (map.get(val) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function groupByAssignedStaff(requests: EnrichedRequest[]): CategoryBucket[] {
  const map = new Map<string, number>();
  requests.forEach(r => {
    const name = r.assigned_name || 'Unassigned';
    map.set(name, (map.get(name) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// --- Section 2: SLA Insights ---
export function computeSlaStats(requests: EnrichedRequest[]): SlaStats {
  const active = requests.filter(r => r.status !== 'Completed');
  const overdue = active.filter(r => r.sla_status === 'Overdue').length;
  const compliancePercent = active.length > 0
    ? Math.round(((active.length - overdue) / active.length) * 100) : 100;

  // Avg resolution time: completed requests, working days from created to updated
  const completed = requests.filter(r => r.status === 'Completed');
  const resolutionDays = completed.map(r => {
    return workingDaysBetween(new Date(r.created_at), new Date(r.updated_at));
  });
  const avgResolutionDays = resolutionDays.length > 0
    ? Math.round((resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length) * 10) / 10 : 0;

  // Avg response time: approximate using created_at to updated_at for In Progress requests
  const inProgress = requests.filter(r => r.status === 'In Progress');
  const responseDays = inProgress.map(r => {
    return workingDaysBetween(new Date(r.created_at), new Date(r.updated_at));
  });
  const avgResponseDays = responseDays.length > 0
    ? Math.round((responseDays.reduce((a, b) => a + b, 0) / responseDays.length) * 10) / 10 : 0;

  return { compliancePercent, avgResolutionDays, avgResponseDays, overdueCount: overdue, totalCount: requests.length };
}

export function computeSlaTrend(requests: EnrichedRequest[]): MonthlySlaBucket[] {
  const map = new Map<string, { total: number; overdue: number }>();
  requests.forEach(r => {
    const month = getMonth(r.created_at);
    const bucket = map.get(month) || { total: 0, overdue: 0 };
    bucket.total++;
    if (r.sla_status === 'Overdue') bucket.overdue++;
    map.set(month, bucket);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total, overdue }]) => ({
      month: getMonthLabel(month),
      compliant: total - overdue,
      overdue,
      compliancePercent: total > 0 ? Math.round(((total - overdue) / total) * 100) : 100,
    }));
}

export function computeResolutionTrend(requests: EnrichedRequest[]): MonthlyBucket[] {
  const completed = requests.filter(r => r.status === 'Completed');
  const map = new Map<string, number[]>();
  completed.forEach(r => {
    const month = getMonth(r.updated_at);
    const days = workingDaysBetween(new Date(r.created_at), new Date(r.updated_at));
    const arr = map.get(month) || [];
    arr.push(days);
    map.set(month, arr);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, days]) => ({
      month: getMonthLabel(month),
      count: Math.round(days.reduce((a, b) => a + b, 0) / days.length * 10) / 10,
    }));
}

// --- Section 3: Project Insights ---
export function computeProjectStats(projects: EnrichedProject[]): ProjectStats {
  const byStatusMap = new Map<string, number>();
  const byOwnerMap = new Map<string, number>();
  projects.forEach(p => {
    byStatusMap.set(p.status, (byStatusMap.get(p.status) || 0) + 1);
    byOwnerMap.set(p.owner_name || 'Unassigned', (byOwnerMap.get(p.owner_name || 'Unassigned') || 0) + 1);
  });

  // Avg duration for completed projects
  const completed = projects.filter(p => p.status === 'Completed' && p.start_date);
  const durations = completed.map(p => {
    const start = new Date(p.start_date!);
    const end = new Date(p.updated_at);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  });
  const avgDurationDays = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  return {
    total: projects.length,
    active: projects.filter(p => p.status === 'Active').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    delayed: projects.filter(p => p.health === 'Delayed').length,
    byStatus: Array.from(byStatusMap.entries()).map(([name, count]) => ({ name, count })),
    byOwner: Array.from(byOwnerMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    avgDurationDays,
  };
}

export function computeProjectCompletionTrend(projects: EnrichedProject[]): MonthlyBucket[] {
  const completed = projects.filter(p => p.status === 'Completed');
  const map = new Map<string, number>();
  completed.forEach(p => {
    const month = getMonth(p.updated_at);
    map.set(month, (map.get(month) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month: getMonthLabel(month), count }));
}

export function computeProjectDurationAnalysis(projects: EnrichedProject[]): CategoryBucket[] {
  return projects
    .filter(p => p.start_date)
    .map(p => {
      const start = new Date(p.start_date!);
      const end = p.status === 'Completed' ? new Date(p.updated_at) : new Date();
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return { name: p.title.length > 20 ? p.title.slice(0, 20) + '…' : p.title, count: days };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// --- Section 4: Team Workload ---
export function computeTeamWorkload(
  requests: EnrichedRequest[],
  projects: EnrichedProject[],
  users: UserRecord[]
): StaffWorkload[] {
  return users.map(u => {
    const assigned = requests.filter(r => r.assigned_to === u.id).length;
    const completed = requests.filter(r => r.assigned_to === u.id && r.status === 'Completed').length;
    const overdue = requests.filter(r => r.assigned_to === u.id && r.sla_status === 'Overdue').length;
    const activeProjects = projects.filter(p => p.owner_id === u.id && p.status === 'Active').length;
    const activeRequests = requests.filter(r => r.assigned_to === u.id && r.status !== 'Completed');
    const overdueActive = activeRequests.filter(r => r.sla_status === 'Overdue').length;
    const slaCompliancePercent = activeRequests.length > 0
      ? Math.round(((activeRequests.length - overdueActive) / activeRequests.length) * 100) : 100;
    const workloadScore = assigned + (activeProjects * 2);

    return { userId: u.id, name: u.name, assigned, completed, activeProjects, overdue, workloadScore, slaCompliancePercent };
  }).sort((a, b) => b.workloadScore - a.workloadScore);
}

// --- Section 5: Management Summary ---
export function computeManagementSummary(
  requests: EnrichedRequest[],
  projects: EnrichedProject[],
  users: UserRecord[]
): ManagementSummary {
  const active = requests.filter(r => r.status !== 'Completed');
  const overdue = active.filter(r => r.sla_status === 'Overdue').length;
  const slaCompliancePercent = active.length > 0
    ? Math.round(((active.length - overdue) / active.length) * 100) : 100;

  const categoryMap = new Map<string, number>();
  requests.forEach(r => {
    const cat = r.category || 'Uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const topCategories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const workloadMap = new Map<string, number>();
  requests.filter(r => r.assigned_to).forEach(r => {
    const name = r.assigned_name || 'Unknown';
    workloadMap.set(name, (workloadMap.get(name) || 0) + 1);
  });
  const workloadDistribution = Array.from(workloadMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRequests: requests.length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'Active').length,
    completedProjects: projects.filter(p => p.status === 'Completed').length,
    slaCompliancePercent,
    overdueCount: overdue,
    topCategories,
    workloadDistribution,
  };
}
