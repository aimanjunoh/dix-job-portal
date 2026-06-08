import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FolderOpen, Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import type { ProjectStats, CategoryBucket, MonthlyBucket } from '../../types/insights';

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

interface Props {
  stats: ProjectStats;
  completionTrend: MonthlyBucket[];
  durationAnalysis: CategoryBucket[];
}

export default function ProjectInsights({ stats, completionTrend, durationAnalysis }: Props) {
  const cards = [
    { label: 'Total Projects', value: stats.total, icon: FolderOpen, color: 'from-blue-500 to-blue-700' },
    { label: 'Active', value: stats.active, icon: Activity, color: 'from-green-400 to-green-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-emerald-400 to-emerald-600' },
    { label: 'Delayed', value: stats.delayed, icon: AlertTriangle, color: 'from-red-500 to-red-700' },
    { label: 'Avg Duration', value: `${stats.avgDurationDays}d`, icon: Clock, color: 'from-amber-400 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Projects by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {stats.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Owner */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Projects by Owner</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.byOwner.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#764ba2" radius={[0, 6, 6, 0]} name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Trend */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Completion Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Duration Analysis */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Duration Analysis (Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={durationAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} unit="d" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#667eea" radius={[6, 6, 0, 0]} name="Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
