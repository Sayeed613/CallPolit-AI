import { useEffect, useState } from 'react'
import { getWeeklyAnalytics, getWeeklyComparison, getDailyTrends, type WeeklyStats, type DailyTrend } from '../lib/api'
import { TrendingUp, TrendingDown, Phone, Calendar, Clock, Users, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts'

export default function AnalyticsTab({ companyId }: { companyId: string }) {
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null)
  const [comparison, setComparison] = useState<{ this_week: WeeklyStats; last_week: WeeklyStats; changes: Record<string, number> } | null>(null)
  const [trends, setTrends] = useState<DailyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(14)

  useEffect(() => {
    Promise.all([
      getWeeklyAnalytics(companyId).then(r => setWeekly(r.data)).catch(() => {}),
      getWeeklyComparison(companyId).then(r => setComparison(r.data)).catch(() => {}),
      getDailyTrends(companyId, days).then(r => setTrends(r.data)).catch(() => {}),
    ]).then(() => setLoading(false))
  }, [companyId, days])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  }

  const statCards = weekly ? [
    { label: 'Total Calls', value: weekly.calls_total, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Connected', value: weekly.calls_connected, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Appointments', value: weekly.appointments_booked, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Avg Duration', value: `${Math.round(weekly.avg_duration_seconds / 60)}m`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Connect Rate', value: `${weekly.connect_rate_pct}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: 'Hours Saved', value: weekly.hours_saved, icon: BarChart3, color: 'text-primary-600', bg: 'bg-primary-100' },
  ] : []

  function changeBadge(key: string) {
    if (!comparison) return null
    const val = comparison.changes[key]
    if (val === undefined || val === null) return null
    const isPositive = val >= 0
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(val).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="card text-center">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison */}
      {comparison && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">This Week vs Last Week</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">Metric</th>
                  <th className="text-right py-2 font-medium text-gray-500">This Week</th>
                  <th className="text-right py-2 font-medium text-gray-500">Last Week</th>
                  <th className="text-right py-2 font-medium text-gray-500">Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'calls_total', label: 'Total Calls' },
                  { key: 'calls_connected', label: 'Connected' },
                  { key: 'appointments_booked', label: 'Appointments' },
                  { key: 'hours_saved', label: 'Hours Saved' },
                  { key: 'connect_rate_pct', label: 'Connect Rate' },
                ].map(({ key, label }) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{label}</td>
                    <td className="text-right py-2 font-medium">
                      {comparison.this_week[key as keyof WeeklyStats]}
                      {key === 'connect_rate_pct' ? '%' : ''}
                    </td>
                    <td className="text-right py-2 text-gray-500">
                      {comparison.last_week[key as keyof WeeklyStats]}
                      {key === 'connect_rate_pct' ? '%' : ''}
                    </td>
                    <td className="text-right py-2">{changeBadge(key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Trends Chart */}
      {trends.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Daily Trends</h3>
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="text-sm border border-gray-300 rounded-lg px-2 py-1">
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" stroke="#3b82f6" name="Calls" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="connected" stroke="#22c55e" name="Connected" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="appointments" stroke="#a855f7" name="Appointments" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
