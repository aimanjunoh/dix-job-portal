import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ClipboardList, FolderOpen, Activity, CheckCircle2,
  ShieldCheck, ShieldAlert
} from 'lucide-react';
import type { ManagementSummary as MgmtSummary } from '../../types/insights';

const COLORS = ['#667eea', '#764ba2', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899'];

interface Props {
  summary: MgmtSummary;
}

export default function ManagementSummary({ summary }: Props) {
  const cards = [
    { label: 'Total Requests', value: summary.totalRequests, icon: ClipboardList, color: 'from-blue-500 to-blue-700' },
    { label: 'Total Projects', value: summary.totalProjects, icon: FolderOpen, color: 'from-purple-500 to-purple-700' },
    { label: 'Active Projects', value: summary.activeProjects, icon: Activity, color: 'from-amber-400 to-amber-600' },
    { label: 'Completed Projects', value: summary.completedProjects, icon: CheckCircle2, color: 'from-green-400 to-green-600' },
    { label: 'SLA Compliance', value: `${summary.slaCompliancePercent}%`, icon: ShieldCheck, color: 'from-emerald-400 to-emerald-600' },
    { label: 'Overdue', value: summary.overdueCount, icon: ShieldAlert, color: 'from-red-500 to-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(card => (
          <div key={card.label} className="glass-card p-4 text-center">
            <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <card.icon className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Request Categories</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.topCategories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#667eea" radius={[0, 6, 6, 0]} name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Workload Distribution (Pie) */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={summary.workloadDistribution.slice(0, 8)}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {summary.workloadDistribution.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary notes */}
      <div className="glass p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="font-semibold text-blue-700 mb-1">Operations</p>
            <p className="text-gray-600">
              {summary.totalRequests} total requests managed with{' '}
              {summary.totalProjects > 0 ? `${summary.totalProjects} projects` : 'no active projects'}.
            </p>
          </div>
          <div className={`${summary.slaCompliancePercent >= 80 ? 'bg-green-50' : 'bg-amber-50'} rounded-xl p-4`}>
            <p className={`font-semibold ${summary.slaCompliancePercent >= 80 ? 'text-green-700' : 'text-amber-700'} mb-1`}>SLA Health</p>
            <p className="text-gray-600">
              {summary.slaCompliancePercent}% compliance rate with{' '}
              {summary.overdueCount} overdue request{summary.overdueCount !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="font-semibold text-purple-700 mb-1">Projects</p>
            <p className="text-gray-600">
              {summary.activeProjects} active, {summary.completedProjects} completed out of {summary.totalProjects} total projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
