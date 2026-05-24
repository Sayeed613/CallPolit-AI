import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  PhoneCall, Megaphone, Users, Calendar,
  TrendingUp, TrendingDown, Activity, Radio,
  Target, ArrowRight, Play, Upload, FileText, BarChart2,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/Skeleton'
import useCompanyStore from '../stores/companyStore'
import useCallStore from '../stores/callStore'
import useAuthStore from '../stores/authStore'
import { liveApi, analyticsApi, campaignsApi } from '../lib/api'
import { formatDuration, maskPhone, getTimeAgo, formatNumber } from '../lib/utils'
import WaveBackground from '../components/three/WaveBackground'

interface DashboardStats {
  total_calls_today: number
  active_campaigns: number
  connection_rate: number
  appointments_today: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25 },
  },
}

function CountUp({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = Math.ceil(value / (duration * 60))
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{formatNumber(count)}</span>
}

export function Dashboard() {
  const navigate = useNavigate()
  const { company } = useCompanyStore()
  const { user } = useAuthStore()
  const { activeCalls, fetchActiveCalls, fetchStats, stats } = useCallStore()
  const [activityFeed, setActivityFeed] = useState<{ type: string; text: string; time: string; icon: string }[]>([])
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_calls_today: 0,
    active_campaigns: 0,
    connection_rate: 0,
    appointments_today: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [liveStats, activityData, campaignList] = await Promise.all([
          liveApi.stats(),
          company?.id ? analyticsApi.activity(company.id) : Promise.resolve({ activities: [] }),
          company?.id ? campaignsApi.list(company.id) : Promise.resolve({ campaigns: [] }),
          fetchActiveCalls(),
          fetchStats(),
        ])
        setDashboardStats({
          total_calls_today: liveStats?.total_today || 0,
          active_campaigns: liveStats?.active_campaigns || 0,
          connection_rate: liveStats?.total_today
            ? Math.round(((liveStats.connected_today || 0) / liveStats.total_today) * 100)
            : 0,
          appointments_today: 0,
        })
        setActivityFeed(activityData?.activities || [])
        setRecentCampaigns((campaignList?.campaigns || []).slice(0, 3))
      } catch {
        // fallback
      }
      setLoading(false)
    }
    load()

    const interval = setInterval(() => {
      fetchActiveCalls()
      fetchStats()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchActiveCalls, fetchStats, company?.id])

  const firstName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    {
      label: 'Total Calls Today',
      value: dashboardStats.total_calls_today,
      icon: PhoneCall,
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Active Campaigns',
      value: dashboardStats.active_campaigns,
      icon: Megaphone,
      trend: null,
      trendUp: false,
      pulse: dashboardStats.active_campaigns > 0,
    },
    {
      label: 'Connection Rate',
      value: `${dashboardStats.connection_rate}%`,
      icon: Target,
      trend: '+5%',
      trendUp: true,
      isFormatted: true,
    },
    {
      label: 'Appointments Today',
      value: dashboardStats.appointments_today,
      icon: Calendar,
      trend: '0%',
      trendUp: false,
    },
  ]

  return (
    <div className="relative">
      <WaveBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-6"
      >
        {/* Greeting */}
        <motion.div variants={cardVariants}>
          <h2 className="text-2xl font-bold text-text-primary">
            {greeting}, {firstName}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            {company?.name || 'CallPilot AI'}
            <span className="mx-2">·</span>
            <Badge variant="brand">Pro Plan</Badge>
            <span className="mx-2">·</span>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <motion.div key={stat.label} variants={cardVariants}>
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-tertiary mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {loading ? <span className="text-text-tertiary">--</span> : stat.isFormatted ? stat.value : <CountUp value={Number(stat.value)} />}
                    </p>
                    {stat.trend && (
                      <p className={`flex items-center gap-1 mt-1 text-xs ${stat.trendUp ? 'text-success' : 'text-text-tertiary'}`}>
                        {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {stat.trend} vs last week
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                      <stat.icon size={18} className="text-brand-400" />
                    </div>
                    {stat.pulse && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full pulse-dot" />
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live calls panel */}
            <motion.div variants={cardVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Live Now</CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-success">
                      <span className="w-1.5 h-1.5 bg-success rounded-full pulse-dot" />
                      {activeCalls.length} active
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/live')}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    View all
                  </button>
                </CardHeader>

                {activeCalls.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Radio size={32} className="text-text-tertiary mb-3" />
                    <p className="text-sm text-text-secondary">No active calls</p>
                    <p className="text-xs text-text-tertiary mt-1">Your AI is ready. Waiting for calls.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {activeCalls.slice(0, 5).map((call) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-subtle"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                            <Activity size={14} className="text-brand-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-text-primary truncate">
                              {call.contact_name || maskPhone(call.contact_phone)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-tertiary">
                              <span>{formatDuration(call.duration || 0)}</span>
                              <span>·</span>
                              <Badge variant={call.verification_status === 'verified' ? 'success' : 'default'} size="sm">
                                {call.verification_status || 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-20 h-1.5 rounded-full bg-bg-overlay overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (call.sentiment_score || 0.5) > 0.6
                                  ? 'bg-success'
                                  : (call.sentiment_score || 0.5) > 0.3
                                    ? 'bg-warning'
                                    : 'bg-error'
                              }`}
                              style={{ width: `${(call.sentiment_score || 0.5) * 100}%` }}
                            />
                          </div>
                          <button className="text-xs text-brand-400 hover:text-brand-300">Intervene</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={cardVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Play, label: 'Launch Campaign', onClick: () => navigate('/campaigns/new'), color: 'text-success' },
                    { icon: Upload, label: 'Import Contacts', onClick: () => navigate('/contacts/import'), color: 'text-brand-400' },
                    { icon: FileText, label: 'Upload PDF', onClick: () => navigate('/documents'), color: 'text-warning' },
                    { icon: BarChart2, label: 'View Analytics', onClick: () => navigate('/analytics'), color: 'text-info' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-bg-surface border border-border-subtle hover:border-border-default transition-all duration-150 group"
                    >
                      <action.icon size={24} className={`${action.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-xs text-text-secondary">{action.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <motion.div variants={cardVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {activityFeed.length > 0 ? (
                    activityFeed.slice(0, 6).map((event, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-surface transition-colors animate-slide-up"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center flex-shrink-0">
                          {event.icon === 'campaign' ? (
                            <Megaphone size={14} className="text-brand-400" />
                          ) : event.icon === 'contacts' ? (
                            <Users size={14} className="text-success" />
                          ) : (
                            <PhoneCall size={14} className="text-info" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary">{event.text}</p>
                          <p className="text-xs text-text-tertiary mt-0.5">{getTimeAgo(event.time)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Activity size={20} className="text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-tertiary">No recent activity</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Recent Campaigns */}
            <motion.div variants={cardVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Campaigns</CardTitle>
                  <button
                    onClick={() => navigate('/campaigns')}
                    className="text-xs text-brand-400 hover:text-brand-300"
                  >
                    View all
                  </button>
                </CardHeader>
                {recentCampaigns.length > 0 ? (
                  <div className="space-y-2">
                    {recentCampaigns.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-subtle cursor-pointer hover:bg-bg-elevated transition-colors"
                        onClick={() => navigate(`/campaigns/${c.id}`)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary truncate">{c.name}</p>
                          <p className="text-xs text-text-tertiary mt-0.5">{getTimeAgo(c.created_at)}</p>
                        </div>
                        <Badge
                          size="sm"
                          variant={c.status === 'running' ? 'success' : c.status === 'completed' ? 'brand' : 'default'}
                          dot={c.status === 'running'}
                        >
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary text-center py-4">
                    No recent campaigns
                  </p>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard
