// Insights TypeScript interfaces

export interface EnrichedRequest {
  id: number;
  request_id: string;
  title: string;
  requester_name: string;
  requester_email: string;
  department: string;
  category: string;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  created_at: string;
  updated_at: string;
  sla_due_date: string | null;
  sla_status: string;
  sla_paused_days: number;
  sla_paused_at: string | null;
  sla_days_remaining: number | null;
  sla_overdue_days: number | null;
  days_unassigned?: number;
}

export interface EnrichedProject {
  id: number;
  project_id: string;
  title: string;
  status: string;
  owner_id: string | null;
  owner_name: string | null;
  progress: number;
  health: string;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

// Computed outputs
export interface RequestStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  escalated: number;
}

export interface CategoryBucket {
  name: string;
  count: number;
}

export interface MonthlyBucket {
  month: string;
  count: number;
}

export interface SlaStats {
  compliancePercent: number;
  avgResolutionDays: number;
  avgResponseDays: number;
  overdueCount: number;
  totalCount: number;
}

export interface MonthlySlaBucket {
  month: string;
  compliant: number;
  overdue: number;
  compliancePercent: number;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  delayed: number;
  byStatus: CategoryBucket[];
  byOwner: CategoryBucket[];
  avgDurationDays: number;
}

export interface ProjectMember {
  project_id: number;
  user_id: string;
}

export interface StaffWorkload {
  userId: string;
  name: string;
  assigned: number;
  completed: number;
  projects: number;
  overdue: number;
  workloadScore: number;
  slaCompliancePercent: number;
}

export interface ManagementSummary {
  totalRequests: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  slaCompliancePercent: number;
  overdueCount: number;
  topCategories: CategoryBucket[];
  workloadDistribution: CategoryBucket[];
}
