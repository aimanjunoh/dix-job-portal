import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ClipboardList, FolderOpen, Activity, CheckCircle2,
  ShieldCheck, ShieldAlert
} from 'lucide-react';
import type { ManagementSummary as MgmtSummary } from '../../types/insights';
import { PIE_TONAL, TONAL, GRID_STROKE, TOOLTIP_STYLE, BAR_RADIUS_H, TICK_FONT, TICK_FONT_SM } from './design-tokens';

interface Props {
  summary: MgmtSummary;
}

const kpiCards = [
  { key: 'totalRequests', label: 'Total Requests', icon: ClipboardList, gradient: 'from-indigo-500/80 to-indigo-600/80' },
  { key: 'totalProjects', label: 'Total Projects', icon: FolderOpen, gradient: 'from-sky-500/70 to-sky-600/70' },
  { key: 'activeProjects', label: 'Active Projects', icon: Activity, gradient: 'from-amber-500/70 to-amber-600/70' },
  { key: 'completedProjects', label: 'Completed', icon: CheckCircle2, gradient: 'from-emerald-500/80 to-emerald-600/80' },
  { key: 'slaCompliancePercent', label: 'SLA Compliance', icon: ShieldCheck, format: (v: number) => `${v}%`, gradient: 'from-indigo-500/80 to-indigo-600/80' },
  { key: 'overdueCount', label: 'Overdue', icon: ShieldAlert, gradient: 'from-red-500/70 to-red-600/70' },
];

export default function ManagementSummary({ summary }: Props) {
  return (
    <div className="space-y-6">
      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map(card => (
          <div key={card.key} className="group relative glass-card p-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm`}>
              <card.icon className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-800 tracking-tight">
              {card.format ? card.format((summary as any)[card.key]) : (summary as any)[card.key]}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Top Request Categories</h3>
          <p className="text-xs text-gray-400 mb-4">Most frequently requested categories</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.topCategories} layout="vertical" barCategoryGap="20%">
              <defs>
                <linearGradient id="barTopCat" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={TONAL[1]} />
                  <stop offset="100%" stopColor={TONAL[0]} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
              <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={120} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
              <Bar dataKey="count" fill="url(#barTopCat)" radius={BAR_RADIUS_H} name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Workload Distribution — Donut */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Workload Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Request volume by staff member</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={summary.workloadDistribution.slice(0, 8)}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={3}
                strokeWidth={0}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {summary.workloadDistribution.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={PIE_TONAL[i % PIE_TONAL.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Executive Summary Notes */}
      <div className="glass p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="relative bg-indigo-500/[0.04] backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-3">
              <ClipboardList size={16} className="text-indigo-600" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">Operations</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              {summary.totalRequests} total requests managed with{' '}
              {summary.totalProjects > 0 ? `${summary.totalProjects} projects` : 'no active projects'}.
            </p>
          </div>
          <div className={`relative backdrop-blur-sm rounded-2xl p-5 border ${
            summary.slaCompliancePercent >= 80
              ? 'bg-emerald-500/[0.04] border-emerald-500/10'
              : 'bg-amber-500/[0.04] border-amber-500/10'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
              summary.slaCompliancePercent >= 80 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
            }`}>
              <ShieldCheck size={16} className={summary.slaCompliancePercent >= 80 ? 'text-emerald-600' : 'text-amber-600'} />
            </div>
            <p className="font-semibold text-gray-800 mb-1">SLA Health</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              {summary.slaCompliancePercent}% compliance rate with{' '}
              {summary.overdueCount} overdue request{summary.overdueCount !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="relative bg-sky-500/[0.04] backdrop-blur-sm rounded-2xl p-5 border border-sky-500/10">
            <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center mb-3">
              <FolderOpen size={16} className="text-sky-600" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">Projects</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              {summary.activeProjects} active, {summary.completedProjects} completed out of {summary.totalProjects} total projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
