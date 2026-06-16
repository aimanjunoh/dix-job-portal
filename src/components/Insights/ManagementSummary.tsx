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
  const hasData = summary.totalRequests > 0 || summary.totalProjects > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {kpiCards.map(card => (
          <div key={card.key} className="group relative glass-card px-3 py-3 sm:p-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${card.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-3 shadow-sm`}>
              <card.icon className="text-white" size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
              {card.format ? card.format((summary as any)[card.key]) : (summary as any)[card.key]}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="glass p-8 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No data available for management summary.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Summary will appear once requests and projects are created.</p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Categories — Horizontal Bar */}
            <div className="glass p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Top Request Categories</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Most frequently requested categories</p>
              {summary.topCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={summary.topCategories} layout="vertical" barCategoryGap="20%">
                    <defs>
                      <linearGradient id="barTopCat" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={TONAL[1]} />
                        <stop offset="100%" stopColor={TONAL[0]} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={120} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                    <Bar dataKey="count" fill="url(#barTopCat)" radius={BAR_RADIUS_H} name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-gray-400 text-xs">No category data available.</div>
              )}
            </div>

            {/* Workload Distribution — Donut */}
            <div className="glass p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Team Workload Distribution</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Request volume by staff member</p>
              {summary.workloadDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={summary.workloadDistribution.slice(0, 8)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
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
              ) : (
                <div className="flex items-center justify-center h-[240px] text-gray-400 text-xs">No workload data available.</div>
              )}
            </div>
          </div>

          {/* Executive Summary Notes */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">Executive Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div className="relative bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-indigo-500/10 dark:border-indigo-500/15">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                  <ClipboardList size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-sm">Operations</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {summary.totalRequests} total requests managed with{' '}
                  {summary.totalProjects > 0 ? `${summary.totalProjects} projects` : 'no active projects'}.
                </p>
              </div>
              <div className={`relative backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border ${
                summary.slaCompliancePercent >= 80
                  ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/10 dark:border-emerald-500/15'
                  : 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border-amber-500/10 dark:border-amber-500/15'
              }`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${
                  summary.slaCompliancePercent >= 80 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                }`}>
                  <ShieldCheck size={14} className={summary.slaCompliancePercent >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-sm">SLA Health</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {summary.slaCompliancePercent}% compliance rate with{' '}
                  {summary.overdueCount} overdue request{summary.overdueCount !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="relative bg-sky-500/[0.04] dark:bg-sky-500/[0.06] backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-sky-500/10 dark:border-sky-500/15">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-sky-500/10 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                  <FolderOpen size={14} className="text-sky-600 dark:text-sky-400" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-sm">Projects</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {summary.activeProjects} active, {summary.completedProjects} completed out of {summary.totalProjects} total projects.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
