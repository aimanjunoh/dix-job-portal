import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { RequestStats, CategoryBucket, MonthlyBucket } from '../../types/insights';

const COLORS = ['#667eea', '#764ba2', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899'];

interface Props {
  stats: RequestStats;
  monthlyTrend: MonthlyBucket[];
  byCategory: CategoryBucket[];
  byDepartment: CategoryBucket[];
  byStaff: CategoryBucket[];
  statusDistribution: CategoryBucket[];
}

export default function RequestInsights({ stats, monthlyTrend, byCategory, byDepartment, byStaff, statusDistribution }: Props) {
  const cards = [
    { label: 'Total Requests', value: stats.total, icon: ClipboardList, color: 'from-blue-500 to-blue-700' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-green-400 to-green-600' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-400 to-amber-600' },
    { label: 'Overdue', value: stats.overdue, icon: ShieldAlert, color: 'from-red-500 to-red-700' },
    { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, color: 'from-orange-500 to-orange-700' },
  ];

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
        {/* Monthly Trend */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Request Trend (Monthly)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} dot={{ fill: '#667eea' }} name="Requests" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Category */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Requests by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byCategory.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#667eea" radius={[6, 6, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Department */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Requests by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byDepartment.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#764ba2" radius={[0, 6, 6, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Staff */}
        <div className="glass p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Requests by Staff</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byStaff.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
