import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, CheckCircle2, FolderOpen, ShieldAlert, Activity, ShieldCheck } from 'lucide-react';
import type { StaffWorkload } from '../../types/insights';
import { TONAL, GRID_STROKE, TOOLTIP_STYLE, BAR_RADIUS, TICK_FONT, TICK_FONT_SM } from './design-tokens';

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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpiCards.map(card => (
          <div key={card.label} className="group relative glass-card p-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm`}>
              <card.icon className="text-white" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-800 tracking-tight">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Workload Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Assigned vs completed per staff member</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workloadData} barCategoryGap="18%">
              <defs>
                <linearGradient id="barWlAssigned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TONAL[0]} />
                  <stop offset="100%" stopColor={TONAL[1]} />
                </linearGradient>
                <linearGradient id="barWlCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TONAL[2]} />
                  <stop offset="100%" stopColor={TONAL[3]} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="name" tick={TICK_FONT_SM} angle={-20} textAnchor="end" height={50} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_FONT} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
              <Bar dataKey="assigned" fill="url(#barWlAssigned)" radius={BAR_RADIUS} name="Assigned" />
              <Bar dataKey="completed" fill="url(#barWlCompleted)" radius={BAR_RADIUS} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Activity Comparison (Stacked) */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Staff Activity Comparison</h3>
          <p className="text-xs text-gray-400 mb-4">Stacked view: completed, active, and overdue</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workloadData} barCategoryGap="18%">
              <defs>
                <linearGradient id="barStackedComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TONAL[2]} />
                  <stop offset="100%" stopColor={TONAL[3]} />
                </linearGradient>
                <linearGradient id="barStackedActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TONAL[0]} />
                  <stop offset="100%" stopColor={TONAL[1]} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="name" tick={TICK_FONT_SM} angle={-20} textAnchor="end" height={50} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_FONT} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
              <Bar dataKey="completed" stackId="a" fill="url(#barStackedComp)" name="Completed" />
              <Bar dataKey="assigned" stackId="a" fill="url(#barStackedActive)" name="Active" />
              <Bar dataKey="overdue" stackId="a" fill="#dc262699" radius={BAR_RADIUS} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff Table */}
      <div className="glass p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Staff Breakdown</h3>
        <p className="text-xs text-gray-400 mb-4">Detailed per-staff performance metrics</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200/60">
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Overdue</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">SLA</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workload</th>
              </tr>
            </thead>
            <tbody>
              {team.map(t => (
                <tr key={t.userId} className="border-b border-gray-100/60 hover:bg-indigo-50/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-gray-700">{t.name}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{t.assigned}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">{t.completed}</td>
                  <td className="py-2.5 px-3 text-center text-indigo-600 font-semibold">{t.activeProjects}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={t.overdue > 0 ? 'text-red-600 font-semibold' : 'text-gray-300'}>{t.overdue}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      t.slaCompliancePercent >= 80 ? 'bg-emerald-50 text-emerald-700' :
                      t.slaCompliancePercent >= 60 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {t.slaCompliancePercent}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="w-16 mx-auto bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          t.workloadScore > 15 ? 'bg-red-500/70' :
                          t.workloadScore > 8 ? 'bg-amber-500/70' :
                          'bg-emerald-500/70'
                        }`}
                        style={{ width: `${Math.min(100, (t.workloadScore / 20) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t.workloadScore}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
