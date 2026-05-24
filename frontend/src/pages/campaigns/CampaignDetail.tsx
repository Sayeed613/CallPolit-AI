import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { api } from '../../lib/api'

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<any>(null)
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [c, logs] = await Promise.all([
          api.campaigns.get(id!),
          api.campaigns.callLogs(id!).catch(() => []),
        ])
        setCampaign(c)
        setCallLogs(Array.isArray(logs) ? (logs as any).call_logs || logs : logs.call_logs || [])
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <PageWrapper title="">
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-12" />
            </Card>
          ))}
        </div>
      </PageWrapper>
    )
  }

  if (!campaign) {
    return (
      <PageWrapper title="Campaign not found">
        <Button variant="secondary" onClick={() => navigate('/campaigns')}>
          ← Back to Campaigns
        </Button>
      </PageWrapper>
    )
  }

  const stats = [
    { label: 'Total Contacts', value: campaign.total_contacts || 0 },
    { label: 'Called', value: campaign.called || 0, color: 'text-brand-400' },
    { label: 'Connected', value: campaign.connected || 0, color: 'text-emerald-400' },
    { label: 'Unreachable', value: campaign.unreachable || 0, color: 'text-yellow-400' },
    { label: 'Invalid', value: campaign.invalid_count || 0, color: 'text-red-400' },
    { label: 'Hot Leads', value: campaign.hot_leads || 0, color: 'text-orange-400' },
  ]

  return (
    <PageWrapper
      title={campaign.name}
      subtitle={`Created ${new Date(campaign.created_at).toLocaleDateString()}`}
      actions={
        <Button variant="secondary" onClick={() => navigate('/campaigns')}>
          ← Back
        </Button>
      }
    >
      {/* Status & Progress */}
      <div className="mb-6 flex items-center gap-4">
        <Badge variant={campaign.status === 'running' ? 'brand' : campaign.status === 'completed' ? 'success' : 'warning'}>
          {campaign.status}
        </Badge>
        <span className="text-sm text-text-muted">
          {campaign.called || 0} / {campaign.total_contacts || 0} contacts called
        </span>
      </div>
      <Progress
        value={campaign.called || 0}
        max={campaign.total_contacts || 1}
        size="md"
        color={campaign.status === 'running' ? 'brand' : 'success'}
        showLabel
        className="mb-8"
      />

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 text-center">
              <p className="text-sm text-text-muted">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color || 'text-text-primary'}`}>
                {stat.value}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="mb-8 flex gap-3">
        {campaign.status === 'running' && (
          <>
            <Button variant="secondary" onClick={async () => {
              await api.campaigns.pause(id!)
              setCampaign((prev: any) => ({ ...prev, status: 'paused' }))
            }}>
              Pause
            </Button>
            <Button variant="secondary" onClick={async () => {
              await api.campaigns.forceComplete(id!)
              setCampaign((prev: any) => ({ ...prev, status: 'completed' }))
            }}>
              Force Complete
            </Button>
          </>
        )}
        {campaign.status === 'paused' && (
          <Button onClick={async () => {
            await api.campaigns.resume(id!)
            setCampaign((prev: any) => ({ ...prev, status: 'running' }))
          }}>
            Resume
          </Button>
        )}
        <Button variant="secondary" onClick={() => {
          // Export CSV
        }}>
          Export CSV
        </Button>
      </div>

      {/* Call Logs */}
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Call Logs</h2>
      <Card>
        {callLogs.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-muted">
            No call logs yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="p-3 font-medium text-text-muted">Phone</th>
                  <th className="p-3 font-medium text-text-muted">Duration</th>
                  <th className="p-3 font-medium text-text-muted">Outcome</th>
                  <th className="p-3 font-medium text-text-muted">Language</th>
                  <th className="p-3 font-medium text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.map((log: any, i: number) => (
                  <tr key={i} className="border-b border-surface-border/50 transition-colors hover:bg-surface-hover">
                    <td className="p-3 text-text-primary">
                      {log.caller_number?.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}
                    </td>
                    <td className="p-3 text-text-secondary">
                      {log.duration ? `${Math.floor(log.duration / 60)}m` : '-'}
                    </td>
                    <td className="p-3">
                      <Badge variant={
                        log.outcome === 'connected' ? 'success' :
                        log.outcome === 'unreachable' ? 'warning' : 'error'
                      } size="sm">
                        {log.outcome || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-3 text-text-secondary">{log.language || '-'}</td>
                    <td className="p-3 text-text-secondary">{log.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
