import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, CheckCircle2, FolderOpen, ShieldAlert, Activity, ShieldCheck } from 'lucide-react';
import type { StaffWorkload } from '../../types/insights';
import { TONAL, GRID_STROKE, TOOLTIP_STYLE, BAR_RADIUS, BAR_RADIUS_H, TICK_FONT, TICK_FONT_SM } from './design-tokens';

interface Props {
  team: StaffWorkload[];
}

export default function TeamWorkload({ team }: Props) {
  const totalAssigned = team.reduce((s, t) => s + t.assigned, 0);
  const totalCompleted = team.reduce((s, t) => s + t.completed, 0);
  const totalOverdue = team.reduce((s, t) => s + t.overdue, 0);
  const avgSla = team.length > 0
    ? Math.round(team.reduce((s, t) => s + t.slaCompliancePercent, 0) / team.length) : 100;

  const kpiCards = [
    { label: 'Team Members', value: team.length, icon: Users, gradient: 'from-indigo-500/80 to-indigo-600/80' },
    { label: 'Total Assigned', value: totalAssigned, icon: Activity, gradient: 'from-sky-500/70 to-sky-600/70' },
    { label: 'Total Completed', value: totalCompleted, icon: CheckCircle2, gradient: 'from-emerald-500/80 to-emerald-600/80' },
    { label: 'Total Overdue', value: totalOverdue, icon: ShieldAlert, gradient: 'from-red-500/70 to-red-600/70' },
    { label: 'Avg SLA', value: `${avgSla}%`, icon: ShieldCheck, gradient: 'from-amber-500/70 to-amber-600/70' },
  ];

  // Workload distribution chart data
  const workloadData = team.slice(0, 10).map(t => ({
    name: t.name.split(' ')[0],
    assigned: t.assigned,
    completed: t.completed,
    overdue: t.overdue,
  }));

  const hasData = team.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {kpiCards.map(card => (
          <div key={card.label} className="group relative glass-card px-3 py-3 sm:p-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${card.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-3 shadow-sm`}>
              <card.icon className="text-white" size={15} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{card.value}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="glass p-8 text-center">
          <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No team data available.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Team analytics will appear once staff members are added.</p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Workload Distribution — Horizontal Bar */}
            <div className="glass p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Team Workload Distribution</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Assigned vs completed per staff member</p>
              {workloadData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={workloadData} layout="vertical" barCategoryGap="18%">
                    <defs>
                      <linearGradient id="barWlAssigned" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={TONAL[0]} />
                        <stop offset="100%" stopColor={TONAL[1]} />
                      </linearGradient>
                      <linearGradient id="barWlCompleted" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={TONAL[2]} />
                        <stop offset="100%" stopColor={TONAL[3]} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                    <Bar dataKey="assigned" fill="url(#barWlAssigned)" radius={BAR_RADIUS_H} name="Assigned" />
                    <Bar dataKey="completed" fill="url(#barWlCompleted)" radius={BAR_RADIUS_H} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-gray-400 text-xs">No workload data available.</div>
              )}
            </div>

            {/* Staff Activity Comparison (Stacked) */}
            <div className="glass p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Staff Activity Comparison</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Stacked view: completed, active, and overdue</p>
              {workloadData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={workloadData} layout="vertical" barCategoryGap="18%">
                    <defs>
                      <linearGradient id="barStackedComp" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={TONAL[2]} />
                        <stop offset="100%" stopColor={TONAL[3]} />
                      </linearGradient>
                      <linearGradient id="barStackedActive" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={TONAL[0]} />
                        <stop offset="100%" stopColor={TONAL[1]} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" tick={TICK_FONT} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={TICK_FONT_SM} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                    <Bar dataKey="completed" stackId="a" fill="url(#barStackedComp)" name="Completed" />
                    <Bar dataKey="assigned" stackId="a" fill="url(#barStackedActive)" name="Active" />
                    <Bar dataKey="overdue" stackId="a" fill="#dc262699" radius={BAR_RADIUS_H} name="Overdue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-gray-400 text-xs">No activity data available.</div>
              )}
            </div>
          </div>

          {/* Staff Table */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Staff Breakdown</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 sm:mb-4">Detailed per-staff performance metrics</p>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/60 dark:border-gray-800/60">
                    <th className="text-left py-2.5 px-2 sm:px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="text-center py-2.5 px-2 sm:px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Assigned</th>
                    <th className="text-center py-2.5 px-2 sm:px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Completed</th>
                    <th className="text-center py-2.5 px-2 sm:px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Projects</th>
                    <th className="text-center py-2.5 px-2 sm:px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Overdue</th>
                    <th className="text-center py-2.5 px-2 sm:px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">SLA</th>
                    <th className="text-center py-2.5 px-2 sm:px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Load</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(t => (
                    <tr key={t.userId} className="border-b border-gray-100/60 dark:border-gray-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors">
                      <td className="py-2 px-2 sm:px-3 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{t.name}</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{t.assigned}</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">{t.completed}</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs sm:text-sm">{t.projects}</td>
                      <td className="py-2 px-2 sm:px-3 text-center">
                        <span className={`text-xs sm:text-sm ${t.overdue > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-300 dark:text-gray-600'}`}>{t.overdue}</span>
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold ${
                          t.slaCompliancePercent >= 80 ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
                          t.slaCompliancePercent >= 60 ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                          'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300'
                        }`}>
                          {t.slaCompliancePercent}%
                        </span>
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-center">
                        <div className="w-12 sm:w-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              t.workloadScore > 15 ? 'bg-red-500/70' :
                              t.workloadScore > 8 ? 'bg-amber-500/70' :
                              'bg-emerald-500/70'
                            }`}
                            style={{ width: `${Math.min(100, (t.workloadScore / 20) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{t.workloadScore}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
