import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { RequestStats, CategoryBucket, MonthlyBucket } from '../../types/insights';
import { TONAL, PIE_TONAL, GRID_STROKE, TOOLTIP_STYLE, BAR_RADIUS, BAR_RADIUS_H, TICK_FONT, TICK_FONT_SM } from './design-tokens';

interface Props {
  stats: RequestStats;
  monthlyTrend: MonthlyBucket[];
  byCategory: CategoryBucket[];
  byDepartment: CategoryBucket[];
  byStaff: CategoryBucket[];
  statusDistribution: CategoryBucket[];
  byUrgency?: CategoryBucket[];
}

const kpiCards = [
  { key: 'total', label: 'Total Requests', icon: ClipboardList, gradient: 'from-indigo-500/80 to-indigo-600/80' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, gradient: 'from-emerald-500/80 to-emerald-600/80' },
  { key: 'pending', label: 'Pending', icon: Clock, gradient: 'from-amber-500/70 to-amber-600/70' },
  { key: 'overdue', label: 'Overdue', icon: ShieldAlert, gradient: 'from-red-500/70 to-red-600/70' },
  { key: 'escalated', label: 'Escalated', icon: AlertTriangle, gradient: 'from-slate-500/70 to-slate-600/70' },
];

function KpiCard({ card, value }: { card: typeof kpiCards[0]; value: number }) {
  return (
    <div className="group relative glass-card px-3 py-3 sm:p-5 text-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${card.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-3 shadow-sm`}>
        <card.icon className="text-white" size={15} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{value}</p>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{card.label}</p>
    </div>
  );
}

export default function RequestInsights({ stats, monthlyTrend, byCategory, byDepartment, byStaff, statusDistribution, byUrgency = [] }: Props) {
  const hasData = stats.total > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {kpiCards.map(card => (
          <KpiCard key={card.key} card={card} value={(stats as any)[card.key]} />
        ))}
      </div>

      {!hasData ? (
        <div className="glass p-8 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No request data available yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Analytics will appear once requests are submitted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Monthly Trend — Line Chart */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Request Volume by Month</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Monthly request volume</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TONAL[0]} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={TONAL[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={TICK_FONT_SM} axisLine={false} tickLine={false} />
                <YAxis tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="count" stroke={TONAL[0]} strokeWidth={2.5}
                  dot={{ fill: TONAL[0], r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: TONAL[0], stroke: '#fff', strokeWidth: 2 }}
                  name="Requests" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution — Donut */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Request Status Distribution</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Current request statuses</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={85} paddingAngle={3} strokeWidth={0}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution.map((_, i) => <Cell key={i} fill={PIE_TONAL[i % PIE_TONAL.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Urgency Distribution — Donut */}
          {byUrgency.length > 0 && (
            <div className="glass p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Urgency Distribution</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Requests by priority level</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byUrgency} dataKey="count" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85} paddingAngle={3} strokeWidth={0}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {byUrgency.map((_, i) => <Cell key={i} fill={PIE_TONAL[i % PIE_TONAL.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Category — Horizontal Bar */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Requests by Category</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Top request categories</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory.slice(0, 8)} layout="vertical" barCategoryGap="20%">
                <defs>
                  <linearGradient id="barCat" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={TONAL[1]} />
                    <stop offset="100%" stopColor={TONAL[0]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={100} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                <Bar dataKey="count" fill="url(#barCat)" radius={BAR_RADIUS_H} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By Department — Horizontal Bar */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Requests by Department</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Department breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDepartment.slice(0, 8)} layout="vertical" barCategoryGap="20%">
                <defs>
                  <linearGradient id="barDept" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={TONAL[1]} />
                    <stop offset="100%" stopColor={TONAL[0]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={100} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                <Bar dataKey="count" fill="url(#barDept)" radius={BAR_RADIUS_H} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By Staff — Horizontal Bar */}
          <div className="glass p-4 sm:p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Requests by Staff</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Assignment distribution across team members</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStaff.slice(0, 10)} layout="vertical" barCategoryGap="20%">
                <defs>
                  <linearGradient id="barStaff" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={TONAL[1]} />
                    <stop offset="100%" stopColor={TONAL[2]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={100} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                <Bar dataKey="count" fill="url(#barStaff)" radius={BAR_RADIUS_H} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
