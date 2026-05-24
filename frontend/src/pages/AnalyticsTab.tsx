import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useCompanyStore } from '../stores/companyStore'
import { api } from '../lib/api'
import { formatDuration } from '../lib/utils'

const dateRanges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

export function AnalyticsTab() {
  const { activeCompany } = useCompanyStore()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7')
  const [stats, setStats] = useState({
    totalCalls: 0,
    connected: 0,
    avgDuration: '0:00',
    conversionRate: 0,
    hotLeads: 0,
    appointments: 0,
  })

  useEffect(() => {
    async function load() {
      const cid = activeCompany?.id || ''
      if (!cid) { setLoading(false); return }
      try {
        const res = await api.analytics.getWeekly(cid)
        const d = res.data
        if (d) {
          setStats({
            totalCalls: d.calls_total || 0,
            connected: d.calls_connected || 0,
            avgDuration: formatDuration(d.avg_duration_seconds) || '0:00',
            conversionRate: d.connect_rate_pct || 0,
            hotLeads: 0,
            appointments: d.appointments_booked || 0,
          })
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange, activeCompany?.id])

  const overviewCards = [
    { label: 'Total Calls', value: stats.totalCalls, icon: '📞', color: 'text-brand-400' },
    { label: 'Connected', value: stats.connected, icon: '✅', color: 'text-emerald-400' },
    { label: 'Avg Duration', value: stats.avgDuration, icon: '⏱', color: 'text-blue-400' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: '📈', color: 'text-violet-400' },
    { label: 'Hot Leads', value: stats.hotLeads, icon: '🔥', color: 'text-orange-400' },
    { label: 'Appointments', value: stats.appointments, icon: '📅', color: 'text-yellow-400' },
  ]

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Track your call center performance"
      actions={
        <div className="flex gap-2">
          <Select
            options={dateRanges}
            value={dateRange}
            onChange={setDateRange}
            className="w-40"
          />
          <Button variant="secondary" size="sm">
            Export PDF
          </Button>
          <Button variant="secondary" size="sm">
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Overview Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {overviewCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 text-center">
              <span className="text-2xl">{card.icon}</span>
              {loading ? (
                <Skeleton className="mx-auto mt-2 h-7 w-16" />
              ) : (
                <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
              )}
              <p className="mt-1 text-xs text-text-muted">{card.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Daily Call Volume</h3>
          <div className="flex h-64 items-center justify-center rounded-lg bg-surface-secondary">
            <span className="text-4xl">📊</span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Connection Rate Trend</h3>
          <div className="flex h-64 items-center justify-center rounded-lg bg-surface-secondary">
            <span className="text-4xl">📈</span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Calls by Hour</h3>
          <div className="flex h-48 items-center justify-center rounded-lg bg-surface-secondary">
            <span className="text-4xl">🕐</span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Language Distribution</h3>
          <div className="flex h-48 items-center justify-center rounded-lg bg-surface-secondary">
            <span className="text-4xl">🌐</span>
          </div>
        </Card>
      </div>

      {/* Industry Benchmarks */}
      <Card className="mt-6 p-6">
        <h3 className="mb-4 font-semibold text-text-primary">Industry Benchmarks</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { metric: 'Avg Connection Rate', yours: '68%', industry: '62%', better: true },
            { metric: 'Avg Call Duration', yours: '3:45', industry: '4:12', better: true },
            { metric: 'Verification Success', yours: '92%', industry: '85%', better: true },
          ].map((benchmark) => (
            <div key={benchmark.metric} className="rounded-lg bg-surface-secondary p-4">
              <p className="mb-2 text-sm text-text-muted">{benchmark.metric}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-text-primary">{benchmark.yours}</p>
                  <p className="text-xs text-text-muted">Your score</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-text-secondary">{benchmark.industry}</p>
                  <p className="text-xs text-text-muted">Industry avg</p>
                </div>
              </div>
              {benchmark.better && (
                <Badge variant="success" size="sm" className="mt-2">
                  Above average
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
    </PageWrapper>
  )
}
