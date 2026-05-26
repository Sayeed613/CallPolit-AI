import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, TrendingUp, TrendingDown, Download } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Progress from '../../components/ui/Progress'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { campaignsApi } from '../../lib/api'
import { formatDateTime, maskPhone, formatDuration } from '../../lib/utils'
import { wsManager } from '../../lib/websocket'
import useCallStore from '../../stores/callStore'

const WS_URL = `${import.meta.env.VITE_WS_URL || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/live/ws`}`

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<any>(null)
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { handleWebSocketEvent, campaignProgress } = useCallStore()

  // ── WebSocket connection for live campaign updates ───────
  useEffect(() => {
    wsManager.connect(WS_URL)

    const unsubs: (() => void)[] = []

    unsubs.push(
      wsManager.on('campaign_progress', (data: any) => {
        handleWebSocketEvent('campaign_progress', data)
      })
    )

    unsubs.push(
      wsManager.on('call_state', (data: any) => {
        handleWebSocketEvent('call_state', data)
        // Reload call logs on final state change
        if (data.final && id) {
          campaignsApi.callLogs(id).then(res => {
            if (res.call_logs) {
              setCallLogs((prev) => {
                const existing = new Map(prev.map((l: any) => [l.id, l]))
                for (const log of res.call_logs) {
                  existing.set(log.id, { ...(existing.get(log.id) || {}), ...log })
                }
                return Array.from(existing.values())
              })
            }
          }).catch(() => {})
        }
      })
    )

    unsubs.push(
      wsManager.on('campaign_state', (data: any) => {
        handleWebSocketEvent('campaign_state', data)
        // Refresh campaign data
        if (id) {
          campaignsApi.get(id).then(setCampaign).catch(() => {})
        }
      })
    )

    return () => {
      unsubs.forEach(fn => fn())
    }
  }, [id, handleWebSocketEvent])

  // ── Load campaign data + poll for updates ────────────────
  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [campaignData, logsData] = await Promise.all([
          campaignsApi.get(id),
          campaignsApi.callLogs(id),
        ])
        setCampaign(campaignData)
        setCallLogs(logsData.call_logs || [])
      } catch {
        // ignore
      }
      setLoading(false)
    }
    load()

    const interval = setInterval(async () => {
      if (!id) return
      try {
        const [campaignData, logsData] = await Promise.all([
          campaignsApi.get(id),
          campaignsApi.callLogs(id),
        ])
        setCampaign(campaignData)
        if (logsData.call_logs) {
          setCallLogs((prev) => {
            const existing = new Map(prev.map((l: any) => [l.id, l]))
            for (const log of logsData.call_logs) {
              existing.set(log.id, { ...(existing.get(log.id) || {}), ...log })
            }
            return Array.from(existing.values())
          })
        }
      } catch {
        // ignore
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [id])

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Campaign not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/campaigns')}>
          Back to campaigns
        </Button>
      </div>
    )
  }

  const total = campaign.total_contacts || 1
  const connected = campaign.connected || 0
  const unreachable = campaign.unreachable || 0
  const invalid = campaign.invalid_count || 0
  const processed = connected + unreachable + invalid
  const progress = Math.round((processed / total) * 100)

  const stats: { label: string; value: string | number }[] = [
    { label: 'Total Contacts', value: total },
    { label: 'Connected', value: connected },
    { label: 'Unreachable', value: unreachable },
    { label: 'Invalid', value: invalid },
    { label: 'Hot Leads', value: campaign.hot_leads || 0 },
    { label: 'Connection Rate', value: total ? `${Math.round((connected / total) * 100)}%` : '0%' },
  ]

  const isRunning = campaign.status === 'running' || campaign.status === 'active'

  return (
    <div className="space-y-6">
      {/* Back + status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to campaigns
        </button>
        <Badge
          variant={isRunning ? 'success' : campaign.status === 'completed' ? 'brand' : 'default'}
          dot={isRunning}
          pulse={isRunning}
        >
          {campaign.status}
        </Badge>
      </div>

      {/* Campaign title */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">{campaign.name}</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Created {formatDateTime(campaign.created_at)}
        </p>
      </div>

      {/* Progress bar */}
      <Progress value={progress} showLabel size="lg" variant={campaign.status === 'failed' ? 'error' : 'default'} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xs text-text-tertiary font-normal">{stat.label}</CardTitle>
              </CardHeader>
              <p className="text-2xl font-bold text-text-primary">
                {stat.value}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Outcome Distribution</CardTitle>
          </CardHeader>
          <div className="h-48 flex items-center justify-center">
            {total > 0 ? (
              <div className="flex items-center gap-6">
                {[
                  { label: 'Connected', value: connected, color: 'text-success stroke-success', percent: ((connected / total) * 100) },
                  { label: 'Unreachable', value: unreachable, color: 'text-warning stroke-warning', percent: ((unreachable / total) * 100) },
                  { label: 'Pending', value: Math.max(0, total - processed), color: 'text-text-tertiary stroke-text-tertiary', percent: (Math.max(0, total - processed) / total) * 100 },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full relative flex items-center justify-center">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                          className="text-bg-overlay" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                          className={item.color}
                          strokeDasharray={`${item.percent * 1.76} 176`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-sm font-bold text-text-primary">
                        {item.value}
                      </span>
                    </div>
                    <span className="text-xs text-text-tertiary">{item.label}</span>
                    <span className="text-xs font-medium text-text-primary">{Math.round(item.percent)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-text-tertiary">No data yet</span>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Call Activity</CardTitle>
          </CardHeader>
          <div className="h-48 flex items-center justify-center">
            {callLogs.length > 0 ? (
              <div className="w-full h-full flex flex-col justify-end gap-1 px-4 pb-4">
                <div className="flex items-end gap-2 h-full">
                  {Array.from({ length: Math.min(12, Math.max(1, Math.ceil(callLogs.length / 2))) }).map((_, i) => {
                    const height = 20 + Math.random() * 60
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-brand-500/30 hover:bg-brand-500/50 transition-colors relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-text-tertiary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {Math.round(height * total / 100)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                  <span>Start</span>
                  <span>Now</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-text-tertiary">Waiting for data...</span>
            )}
          </div>
        </Card>
      </div>

      {/* Call Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
          <Button variant="ghost" size="sm" icon={<Download size={14} />}>
            Export
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs text-text-tertiary">
                <th className="text-left py-3 px-2 font-medium">Phone</th>
                <th className="text-left py-3 px-2 font-medium">Name</th>
                <th className="text-left py-3 px-2 font-medium">Status</th>
                <th className="text-left py-3 px-2 font-medium">Duration</th>
                <th className="text-left py-3 px-2 font-medium">Sentiment</th>
                <th className="text-left py-3 px-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className="border-b border-border-subtle hover:bg-bg-surface transition-colors">
                  <td className="py-3 px-2 text-text-primary">{maskPhone(log.contact_phone)}</td>
                  <td className="py-3 px-2 text-text-primary">{log.contact_name || '-'}</td>
                  <td className="py-3 px-2">
                    <Badge
                      size="sm"
                      variant={log.status === 'completed' ? 'success' : log.status === 'in-progress' ? 'brand' : log.status === 'ringing' ? 'warning' : log.status === 'no-answer' || log.status === 'failed' ? 'error' : 'default'}
                    >
                      {log.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-text-secondary">{formatDuration(log.duration)}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-bg-overlay overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (log.sentiment_score || 0.5) >= 0.6 ? 'bg-success' :
                            (log.sentiment_score || 0.5) >= 0.3 ? 'bg-warning' : 'bg-error'
                          }`}
                          style={{ width: `${(log.sentiment_score || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {Math.round((log.sentiment_score || 0.5) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-text-tertiary">
                    {log.created_at ? formatDateTime(log.created_at) : '-'}
                  </td>
                </tr>
              ))}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-tertiary">
                    No call logs yet. Launch the campaign to start seeing results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default CampaignDetail
