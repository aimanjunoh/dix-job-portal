import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import { ShieldCheck, Timer, TrendingUp, ShieldAlert } from 'lucide-react';
import type { SlaStats, MonthlySlaBucket, MonthlyBucket } from '../../types/insights';
import { TONAL, GRID_STROKE, TOOLTIP_STYLE, BAR_RADIUS, TICK_FONT, TICK_FONT_SM } from './design-tokens';

interface Props {
  stats: SlaStats;
  slaTrend: MonthlySlaBucket[];
  overdueTrend: MonthlySlaBucket[];
  resolutionTrend: MonthlyBucket[];
}

const kpiCards = [
  { key: 'compliancePercent', label: 'SLA Compliance', icon: ShieldCheck, format: (v: number) => `${v}%`, gradient: 'from-emerald-500/80 to-emerald-600/80' },
  { key: 'avgResolutionDays', label: 'Avg Resolution', icon: Timer, format: (v: number) => `${v}d`, gradient: 'from-indigo-500/80 to-indigo-600/80' },
  { key: 'avgResponseDays', label: 'Avg Response', icon: TrendingUp, format: (v: number) => `${v}d`, gradient: 'from-amber-500/70 to-amber-600/70' },
  { key: 'overdueCount', label: 'Overdue', icon: ShieldAlert, format: (v: number) => `${v}`, gradient: 'from-red-500/70 to-red-600/70' },
];

export default function SlaInsights({ stats, slaTrend, overdueTrend, resolutionTrend }: Props) {
  const hasSlaData = stats.totalCount > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {kpiCards.map(card => (
          <div key={card.key} className="group relative glass-card px-3 py-3 sm:p-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${card.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-3 shadow-sm`}>
              <card.icon className="text-white" size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{card.format((stats as any)[card.key])}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {!hasSlaData ? (
        <div className="glass p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Not enough SLA data to calculate compliance.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">SLA analytics will appear once requests are active.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* SLA Compliance Trend — Area/Line Chart */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">SLA Compliance Trend</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Monthly compliance percentage</p>
            {slaTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={slaTrend}>
                  <defs>
                    <linearGradient id="areaCompliance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TONAL[0]} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={TONAL[0]} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={TICK_FONT_SM} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_FONT} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="compliancePercent" stroke={TONAL[0]} strokeWidth={2.5}
                    fill="url(#areaCompliance)" name="Compliance %"
                    dot={{ fill: TONAL[0], r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: TONAL[0], stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No trend data available yet.</div>
            )}
          </div>

          {/* Overdue Trend — Bar Chart */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Overdue Requests by Month</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Overdue vs compliant requests by month</p>
            {overdueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={overdueTrend} barCategoryGap="18%">
                  <defs>
                    <linearGradient id="barOverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="barCompliant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TONAL[1]} />
                      <stop offset="100%" stopColor={TONAL[2]} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="month" tick={TICK_FONT_SM} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                  <Bar dataKey="overdue" fill="url(#barOverdue)" radius={BAR_RADIUS} name="Overdue" />
                  <Bar dataKey="compliant" fill="url(#barCompliant)" radius={BAR_RADIUS} name="Compliant" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No overdue trend available yet.</div>
            )}
          </div>

          {/* Resolution Time Trend — Line Chart */}
          <div className="glass p-4 sm:p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Average Resolution Time</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Average working days to resolve requests</p>
            {resolutionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={resolutionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={TICK_FONT_SM} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_FONT} axisLine={false} tickLine={false} unit="d" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="count" stroke={TONAL[0]} strokeWidth={2.5}
                    dot={{ fill: TONAL[0], r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: TONAL[0], stroke: '#fff', strokeWidth: 2 }}
                    name="Avg Days" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No resolution trend available yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
