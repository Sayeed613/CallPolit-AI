import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/Skeleton'
import { analyticsApi } from '../lib/api'
import useCompanyStore from '../stores/companyStore'

const dateRanges = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom' },
]

interface AnalyticsData {
  total_calls: number
  connected: number
  connection_rate: number
  avg_duration: string
  total_today: number
  connected_today: number
  today_connection_rate: number
  active_campaigns: number
  completed_campaigns: number
  total_contacts: number
  hot_leads: number
  appointments: number
}

export function AnalyticsTab() {
  const { company } = useCompanyStore()
  const [dateRange, setDateRange] = useState('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, custom: 30 }

  useEffect(() => {
    if (!company?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const days = daysMap[dateRange] || 30
        const result = await analyticsApi.stats(company.id, days)
        setData(result)
      } catch {
        setData(null)
      }
      setLoading(false)
    }
    load()
  }, [company?.id, dateRange])

  const statsCards = data ? [
    { label: 'Total Calls (30d)', value: data.total_calls.toLocaleString(), trend: null, trendUp: true },
    { label: 'Connected', value: data.connected.toLocaleString(), trend: `${data.connection_rate}%`, trendUp: true },
    { label: 'Connection Rate', value: `${data.connection_rate}%`, trend: null, trendUp: true },
    { label: 'Avg Duration', value: data.avg_duration, trend: null, trendUp: false },
    { label: 'Hot Leads', value: data.hot_leads.toLocaleString(), trend: null, trendUp: true },
    { label: 'Appointments', value: data.appointments.toLocaleString(), trend: null, trendUp: true },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Analytics</h2>
          <p className="text-sm text-text-tertiary">Track your call performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={14} />}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" icon={<Calendar size={14} />}>
            {dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </Button>
        </div>
      </div>

      {/* Date range */}
      <div className="flex gap-1 p-1 bg-bg-surface rounded-lg border border-border-default w-fit">
        {dateRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => setDateRange(range.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              dateRange === range.value
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statsCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <Card>
                  <p className="text-xs text-text-tertiary mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  {stat.trend && (
                    <p className={`flex items-center gap-1 mt-1 text-xs ${stat.trendUp ? 'text-success' : 'text-text-tertiary'}`}>
                      {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stat.trend}
                    </p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Today's stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle text-center">
                <p className="text-xs text-text-tertiary mb-1">Calls Today</p>
                <p className="text-2xl font-bold text-text-primary">{data.total_today}</p>
              </div>
              <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle text-center">
                <p className="text-xs text-text-tertiary mb-1">Connected Today</p>
                <p className="text-2xl font-bold text-text-primary">{data.connected_today}</p>
              </div>
              <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle text-center">
                <p className="text-xs text-text-tertiary mb-1">Connection Rate Today</p>
                <p className="text-2xl font-bold text-text-primary">{data.today_connection_rate}%</p>
              </div>
            </div>
          </Card>

          {/* Campaign stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle text-center">
                  <p className="text-xs text-text-tertiary mb-1">Active</p>
                  <p className="text-2xl font-bold text-success">{data.active_campaigns}</p>
                </div>
                <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle text-center">
                  <p className="text-xs text-text-tertiary mb-1">Completed</p>
                  <p className="text-2xl font-bold text-brand-400">{data.completed_campaigns}</p>
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Contacts</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle text-center">
                  <p className="text-xs text-text-tertiary mb-1">Total</p>
                  <p className="text-2xl font-bold text-text-primary">{data.total_contacts}</p>
                </div>
                <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle text-center">
                  <p className="text-xs text-text-tertiary mb-1">Hot Leads</p>
                  <p className="text-2xl font-bold text-warning">{data.hot_leads}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts placeholder - ready for Recharts integration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Call Volume</CardTitle>
              </CardHeader>
              <div className="h-64 flex items-center justify-center text-sm text-text-tertiary">
                {data.total_calls > 0
                  ? `${data.total_calls} calls in the last 30 days`
                  : 'No call data yet. Launch a campaign to see call volume.'}
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Connection Rate Trend</CardTitle>
              </CardHeader>
              <div className="h-64 flex items-center justify-center text-sm text-text-tertiary">
                {data.total_calls > 0
                  ? `${data.connection_rate}% overall connection rate`
                  : 'No call data yet.'}
              </div>
            </Card>
          </div>

          {/* Industry Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Connection Rate', yours: `${data.connection_rate}%`, avg: '65%', above: data.connection_rate > 65 },
                { label: 'Avg Call Duration', yours: data.avg_duration, avg: '4:10', above: false },
                { label: 'Total Contacts', yours: data.total_contacts.toLocaleString(), avg: 'N/A', above: true },
              ].map((benchmark) => (
                <div key={benchmark.label} className="p-4 rounded-lg bg-bg-surface border border-border-subtle">
                  <p className="text-xs text-text-tertiary mb-2">{benchmark.label}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{benchmark.yours}</p>
                      <p className="text-xs text-text-tertiary">Your metric</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">{benchmark.avg}</p>
                      <p className="text-xs text-text-tertiary">Industry avg</p>
                    </div>
                  </div>
                  <Badge variant={benchmark.above ? 'success' : 'warning'} size="sm" className="mt-2">
                    {benchmark.above ? '↑ Above average' : '↓ Below average'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <BarChart2 size={40} className="text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">No analytics data available</p>
          <p className="text-xs text-text-tertiary mt-1">Data will appear once you start making calls</p>
        </div>
      )}
    </div>
  )
}

export default AnalyticsTab
