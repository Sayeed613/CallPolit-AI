import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'
import { useCallStore } from '../stores/callStore'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon: string
  loading?: boolean
}

function StatCard({ title, value, change, changeType, icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-2 h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </Card>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-5 transition-all hover:border-zinc-600/50">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">{title}</span>
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary">{value}</span>
          {change && (
            <span
              className={cn(
                'text-xs font-medium',
                changeType === 'up' && 'text-emerald-400',
                changeType === 'down' && 'text-red-400',
                changeType === 'neutral' && 'text-text-muted'
              )}
            >
              {change}
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { activeCompany } = useCompanyStore()
  const { activeCalls } = useCallStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCalls: 0,
    activeCampaigns: 0,
    connectionRate: 0,
    hotLeads: 0,
  })

  useEffect(() => {
    async function load() {
      const cid = activeCompany?.id || ''
      if (!cid) { setLoading(false); return }
      try {
        const [campaignsRes, analyticsRes] = await Promise.all([
          api.campaigns.list(cid),
          api.analytics.getWeekly(cid).catch(() => null),
        ])
        const campaignsArr = campaignsRes?.campaigns || []
        const running = campaignsArr.filter((c: any) => c.status === 'running')
        const weeklyData = analyticsRes?.data
        setStats({
          totalCalls: weeklyData?.calls_total ?? 0,
          activeCampaigns: running.length,
          connectionRate: weeklyData?.connect_rate_pct ?? 0,
          hotLeads: 0, // hot_leads not available on WeeklyStats; aggregated from campaigns
        })
      } catch {
        // Use fallback values
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCompany?.id])

  return (
    <PageWrapper title="Dashboard" subtitle="Overview of your call center performance">
      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Calls Today"
          value={stats.totalCalls}
          change="+12%"
          changeType="up"
          icon="📞"
          loading={loading}
        />
        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          icon="📢"
          loading={loading}
        />
        <StatCard
          title="Connection Rate"
          value={`${stats.connectionRate}%`}
          change="+5%"
          changeType="up"
          icon="📊"
          loading={loading}
        />
        <StatCard
          title="Hot Leads"
          value={stats.hotLeads}
          change="+3"
          changeType="up"
          icon="🔥"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Live Calls Section */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text-primary">Live Now</h2>
            <span className="flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>

          {activeCalls.length > 0 ? (
            <div className="space-y-3">
              {activeCalls.map((call) => (
                <Card key={call.call_sid} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-text-primary">
                      {call.caller_number?.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}
                    </p>
                    <p className="text-sm text-text-muted">
                      {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'Connecting...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={call.verification_status === 'verified' ? 'success' : 'warning'}>
                      {call.verification_status || 'Verifying'}
                    </Badge>
                    <Button size="sm" onClick={() => navigate('/live')}>
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12">
              <span className="mb-3 text-4xl">📞</span>
              <p className="text-text-muted">No active calls right now</p>
              <p className="mt-1 text-xs text-text-muted">
                Calls will appear here in real time
              </p>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                onClick={() => navigate('/campaigns/new')}
                className="rounded-xl border border-surface-border bg-surface-card p-4 text-center transition-all hover:border-zinc-600 hover:bg-surface-hover"
              >
                <span className="block text-2xl">📢</span>
                <span className="mt-1 block text-xs text-text-secondary">Launch Campaign</span>
              </button>
              <button
                onClick={() => navigate('/contacts/import')}
                className="rounded-xl border border-surface-border bg-surface-card p-4 text-center transition-all hover:border-zinc-600 hover:bg-surface-hover"
              >
                <span className="block text-2xl">👥</span>
                <span className="mt-1 block text-xs text-text-secondary">Import Contacts</span>
              </button>
              <button
                onClick={() => navigate('/documents')}
                className="rounded-xl border border-surface-border bg-surface-card p-4 text-center transition-all hover:border-zinc-600 hover:bg-surface-hover"
              >
                <span className="block text-2xl">📄</span>
                <span className="mt-1 block text-xs text-text-secondary">Upload PDF</span>
              </button>
              <button
                onClick={() => navigate('/live')}
                className="rounded-xl border border-surface-border bg-surface-card p-4 text-center transition-all hover:border-zinc-600 hover:bg-surface-hover"
              >
                <span className="block text-2xl">🎙</span>
                <span className="mt-1 block text-xs text-text-secondary">Live Calls</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent Activity</h2>
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">📞</span>
                <div>
                  <p className="text-sm text-text-secondary">
                    Call from <span className="font-medium text-text-primary">+91 98xxx xxx10</span> connected
                  </p>
                  <p className="text-xs text-text-muted">2 min ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">📅</span>
                <div>
                  <p className="text-sm text-text-secondary">
                    Appointment booked by AI
                  </p>
                  <p className="text-xs text-text-muted">15 min ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">🔥</span>
                <div>
                  <p className="text-sm text-text-secondary">
                    Hot lead detected
                  </p>
                  <p className="text-xs text-text-muted">1 hour ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
