import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, CheckCircle2, FolderOpen, ShieldAlert, Activity, ShieldCheck } from 'lucide-react';
import type { StaffWorkload } from '../../types/insights';

interface Props {
  team: StaffWorkload[];
}

export default function TeamWorkload({ team }: Props) {
  const totalAssigned = team.reduce((s, t) => s + t.assigned, 0);
  const totalCompleted = team.reduce((s, t) => s + t.completed, 0);
  const totalOverdue = team.reduce((s, t) => s + t.overdue, 0);
  const avgSla = team.length > 0
    ? Math.round(team.reduce((s, t) => s + t.slaCompliancePercent, 0) / team.length) : 100;

  const cards = [
    { label: 'Team Members', value: team.length, icon: Users, color: 'from-blue-500 to-blue-700' },
    { label: 'Total Assigned', value: totalAssigned, icon: Activity, color: 'from-amber-400 to-amber-600' },
    { label: 'Total Completed', value: totalCompleted, icon: CheckCircle2, color: 'from-green-400 to-green-600' },
    { label: 'Total Overdue', value: totalOverdue, icon: ShieldAlert, color: 'from-red-500 to-red-700' },
    { label: 'Avg SLA Compliance', value: `${avgSla}%`, icon: ShieldCheck, color: 'from-emerald-400 to-emerald-600' },
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
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        {/* Workload Distribution */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="assigned" fill="#667eea" radius={[6, 6, 0, 0]} name="Assigned" />
              <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Activity Comparison (Stacked) */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Staff Activity Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
              <Bar dataKey="assigned" stackId="a" fill="#667eea" name="Active" />
              <Bar dataKey="overdue" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff Table */}
      <div className="glass p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Staff Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Name</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Assigned</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Completed</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Projects</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Overdue</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">SLA %</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Workload</th>
              </tr>
            </thead>
            <tbody>
              {team.map(t => (
                <tr key={t.userId} className="border-b border-gray-100 hover:bg-white/50">
                  <td className="py-2 px-3 font-medium text-gray-800">{t.name}</td>
                  <td className="py-2 px-3 text-center text-gray-600">{t.assigned}</td>
                  <td className="py-2 px-3 text-center text-green-600 font-medium">{t.completed}</td>
                  <td className="py-2 px-3 text-center text-blue-600 font-medium">{t.activeProjects}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={t.overdue > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>{t.overdue}</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.slaCompliancePercent >= 80 ? 'bg-green-100 text-green-700' :
                      t.slaCompliancePercent >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t.slaCompliancePercent}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="w-16 mx-auto bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${t.workloadScore > 15 ? 'bg-red-500' : t.workloadScore > 8 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (t.workloadScore / 20) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t.workloadScore}</p>
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
