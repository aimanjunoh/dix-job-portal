import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FolderOpen, Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import type { ProjectStats, CategoryBucket, MonthlyBucket } from '../../types/insights';
import { PIE_TONAL, GRID_STROKE, TOOLTIP_STYLE, BAR_RADIUS, BAR_RADIUS_H, TICK_FONT, TICK_FONT_SM } from './design-tokens';

interface Props {
  stats: ProjectStats;
  completionTrend: MonthlyBucket[];
  durationAnalysis: CategoryBucket[];
}

const kpiCards = [
  { key: 'total', label: 'Total Projects', icon: FolderOpen, gradient: 'from-indigo-500/80 to-indigo-600/80' },
  { key: 'active', label: 'Active', icon: Activity, gradient: 'from-sky-500/70 to-sky-600/70' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, gradient: 'from-emerald-500/80 to-emerald-600/80' },
  { key: 'delayed', label: 'Delayed', icon: AlertTriangle, gradient: 'from-red-500/70 to-red-600/70' },
  { key: 'avgDurationDays', label: 'Avg Duration', icon: Clock, format: (v: number) => `${v}d`, gradient: 'from-amber-500/70 to-amber-600/70' },
];

export default function ProjectInsights({ stats, completionTrend, durationAnalysis }: Props) {
  const hasData = stats.total > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {kpiCards.map(card => (
          <div key={card.key} className="group relative glass-card px-3 py-3 sm:p-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${card.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-3 shadow-sm`}>
              <card.icon className="text-white" size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
              {card.format ? card.format((stats as any)[card.key]) : (stats as any)[card.key]}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="glass p-8 text-center">
          <FolderOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No project data available yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Project analytics will appear once projects are created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Status Distribution — Donut */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Project Status Distribution</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Current project status breakdown</p>
            {stats.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85} paddingAngle={3} strokeWidth={0}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.byStatus.map((_, i) => <Cell key={i} fill={PIE_TONAL[i % PIE_TONAL.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No status data available.</div>
            )}
          </div>

          {/* By Owner — Horizontal Bar */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Projects by Owner</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Project ownership distribution</p>
            {stats.byOwner.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.byOwner.slice(0, 8)} layout="vertical" barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barOwner" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                  <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={100} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                  <Bar dataKey="count" fill="url(#barOwner)" radius={BAR_RADIUS_H} name="Projects" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No owner data available.</div>
            )}
          </div>

          {/* Completion Trend — Bar */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Project Completion Trend</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Projects completed per month</p>
            {completionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={completionTrend} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barComplete" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="month" tick={TICK_FONT_SM} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                  <Bar dataKey="count" fill="url(#barComplete)" radius={BAR_RADIUS} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No project trend available yet.</div>
            )}
          </div>

          {/* Duration Analysis — Horizontal Bar */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Project Duration Analysis</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Average project duration in days</p>
            {durationAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={durationAnalysis} layout="vertical" barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barDuration" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                  <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} unit="d" />
                  <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={120} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                  <Bar dataKey="count" fill="url(#barDuration)" radius={BAR_RADIUS_H} name="Days" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No duration data available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
