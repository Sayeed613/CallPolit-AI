import { useEffect, useState } from 'react'
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

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<any>(null)
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        // fallback
      }
      setLoading(false)
    }
    load()
  }, [id])

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
  const progress = Math.round(
    ((campaign.connected + campaign.unreachable + campaign.invalid_count) / total) * 100,
  )

  const stats = [
    { label: 'Total Contacts', value: campaign.total_contacts || 0, icon: Phone },
    { label: 'Connected', value: campaign.connected || 0, icon: TrendingUp, color: 'text-success' },
    { label: 'Unreachable', value: campaign.unreachable || 0, icon: TrendingDown, color: 'text-warning' },
    { label: 'Invalid', value: campaign.invalid_count || 0, icon: TrendingDown, color: 'text-error' },
    { label: 'Hot Leads', value: campaign.hot_leads || 0, icon: TrendingUp, color: 'text-brand-400' },
    { label: 'Connection Rate', value: total ? `${Math.round((campaign.connected / total) * 100)}%` : '0%', icon: TrendingUp, color: 'text-success' },
  ]

  return (
    <div className="space-y-6">
      {/* Back + status */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/campaigns')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={16} />
          Back to campaigns
        </button>
        <Badge variant={campaign.status === 'running' ? 'success' : campaign.status === 'completed' ? 'brand' : 'default'} dot pulse={campaign.status === 'running'}>
          {campaign.status}
        </Badge>
      </div>

      <div>
        <h1 className="text-xl font-bold text-text-primary">{campaign.name}</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Created {formatDateTime(campaign.created_at)}
        </p>
      </div>

      {/* Progress */}
      <Progress value={progress} showLabel label="Campaign Progress" size="lg" />

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
                <stat.icon size={16} className={stat.color || 'text-text-tertiary'} />
              </CardHeader>
              <p className={`text-2xl font-bold ${stat.color || 'text-text-primary'}`}>{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Calls Over Time</CardTitle>
          </CardHeader>
          <div className="h-48 flex items-center justify-center text-sm text-text-tertiary">
            Chart will render here with Recharts
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outcome Distribution</CardTitle>
          </CardHeader>
          <div className="h-48 flex items-center justify-center text-sm text-text-tertiary">
            Chart will render here with Recharts
          </div>
        </Card>
      </div>

      {/* Call logs */}
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
                <th className="text-left py-3 px-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.slice(0, 20).map((log) => (
                <tr key={log.id} className="border-b border-border-subtle hover:bg-bg-surface transition-colors">
                  <td className="py-3 px-2 text-text-primary">{maskPhone(log.contact_phone)}</td>
                  <td className="py-3 px-2 text-text-primary">{log.contact_name || '-'}</td>
                  <td className="py-3 px-2">
                    <Badge
                      size="sm"
                      variant={log.status === 'completed' ? 'success' : log.status === 'in-progress' ? 'brand' : 'default'}
                    >
                      {log.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-text-secondary">{formatDuration(log.duration)}</td>
                  <td className="py-3 px-2 text-text-tertiary">{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-tertiary">
                    No call logs yet
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
