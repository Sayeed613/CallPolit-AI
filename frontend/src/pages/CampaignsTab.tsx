import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'
import { Tabs } from '../components/ui/Tabs'
import { Skeleton } from '../components/ui/Skeleton'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useCompanyStore } from '../stores/companyStore'
import { api } from '../lib/api'

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
  { id: 'scheduled', label: 'Scheduled' },
]

const statusColors: Record<string, 'brand' | 'success' | 'warning' | 'error'> = {
  running: 'brand',
  completed: 'success',
  failed: 'error',
  scheduled: 'warning',
  paused: 'warning',
}

export function CampaignsTab() {
  const navigate = useNavigate()
  const { activeCompany } = useCompanyStore()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    async function load() {
      const cid = activeCompany?.id || ''
      if (!cid) { setLoading(false); return }
      try {
        const res = await api.campaigns.list(cid)
        setCampaigns(res.campaigns || [])
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCompany?.id])

  const filtered = activeTab === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === activeTab)

  return (
    <PageWrapper
      title="Campaigns"
      subtitle="Manage your outbound calling campaigns"
      actions={
        <Button onClick={() => navigate('/campaigns/new')} icon="plus">
          Launch Campaign
        </Button>
      }
    >
      <Tabs
        tabs={tabs.map((t) => ({
          ...t,
          badge: t.id === 'all' ? campaigns.length : campaigns.filter((c) => c.status === t.id).length,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="mb-3 h-5 w-40" />
              <Skeleton className="mb-4 h-2 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center py-16">
          <span className="mb-4 text-5xl">📢</span>
          <h3 className="mb-2 text-lg font-medium text-text-primary">No campaigns yet</h3>
          <p className="mb-6 text-sm text-text-muted">Launch your first campaign to start reaching customers</p>
          <Button onClick={() => navigate('/campaigns/new')}>Launch Campaign</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((campaign, i) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer p-5 transition-all hover:border-zinc-600/50"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary">{campaign.name}</h3>
                    <p className="text-xs text-text-muted">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={statusColors[campaign.status] || 'brand'}>
                    {campaign.status}
                  </Badge>
                </div>

                <Progress
                  value={campaign.called || 0}
                  max={campaign.total_contacts || 1}
                  size="sm"
                  className="mb-3"
                />

                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span>{campaign.called || 0} / {campaign.total_contacts || 0} called</span>
                  <span>{campaign.connected || 0} connected</span>
                  {campaign.hot_leads > 0 && (
                    <span className="text-yellow-400">{campaign.hot_leads} hot</span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
