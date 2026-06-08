import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import { ShieldCheck, Timer, TrendingUp, ShieldAlert } from 'lucide-react';
import type { SlaStats, MonthlySlaBucket, MonthlyBucket } from '../../types/insights';

interface Props {
  stats: SlaStats;
  slaTrend: MonthlySlaBucket[];
  overdueTrend: MonthlySlaBucket[];
  resolutionTrend: MonthlyBucket[];
}

export default function SlaInsights({ stats, slaTrend, overdueTrend, resolutionTrend }: Props) {
  const cards = [
    { label: 'SLA Compliance', value: `${stats.compliancePercent}%`, icon: ShieldCheck, color: 'from-green-400 to-green-600' },
    { label: 'Avg Resolution', value: `${stats.avgResolutionDays}d`, icon: Timer, color: 'from-blue-400 to-blue-600' },
    { label: 'Avg Response', value: `${stats.avgResponseDays}d`, icon: TrendingUp, color: 'from-amber-400 to-amber-600' },
    { label: 'Overdue', value: stats.overdueCount, icon: ShieldAlert, color: 'from-red-500 to-red-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        {/* SLA Compliance Trend */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">SLA Compliance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={slaTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="compliancePercent" stroke="#10b981" fill="#d1fae5" name="Compliance %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Overdue Trend */}
        <div className="glass p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Overdue Trend by Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={overdueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="overdue" fill="#ef4444" radius={[6, 6, 0, 0]} name="Overdue" />
              <Bar dataKey="compliant" fill="#10b981" radius={[6, 6, 0, 0]} name="Compliant" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution Time Trend */}
        <div className="glass p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Resolution Time Trend (Avg Working Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={resolutionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="d" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} dot={{ fill: '#667eea' }} name="Avg Days" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
