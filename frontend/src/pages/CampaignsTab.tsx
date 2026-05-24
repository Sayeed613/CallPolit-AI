import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Megaphone, Plus, Play, Pause, XCircle, ChevronRight, Clock } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import Tabs from '../components/ui/Tabs'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { SkeletonCard } from '../components/ui/Skeleton'
import { campaignsApi } from '../lib/api'
import { formatDate, formatNumber } from '../lib/utils'
import useCompanyStore from '../stores/companyStore'
import { useToast } from '../components/ui/Toast'

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'brand' | 'default'> = {
  running: 'success',
  paused: 'warning',
  failed: 'error',
  completed: 'brand',
  draft: 'default',
  scheduled: 'default',
}

const statusFilterTabs = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'scheduled', label: 'Scheduled' },
]

export function CampaignsTab() {
  const navigate = useNavigate()
  const { company } = useCompanyStore()
  const { addToast } = useToast()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [launchData, setLaunchData] = useState({
    name: '',
    calls_per_minute: 5,
    schedule_type: 'now',
    language: 'auto',
  })

  useEffect(() => {
    if (!company?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const data = await campaignsApi.list(company.id)
        setCampaigns(data.campaigns || [])
      } catch {
        // fallback
      }
      setLoading(false)
    }
    load()
  }, [company?.id])

  const filtered = filter === 'all' ? campaigns : campaigns.filter((c) => c.status === filter)
  const allFilterTabs = statusFilterTabs.map((tab) => ({
    ...tab,
    count: tab.value === 'all' ? campaigns.length : campaigns.filter((c) => c.status === tab.value).length,
  }))

  const handleLaunch = async () => {
    if (!company?.id || !launchData.name) return
    try {
      const result = await campaignsApi.create({
        company_id: company.id,
        ...launchData,
      })
      await campaignsApi.launch(result.id)
      addToast({ type: 'success', message: 'Campaign launched!' })
      setShowLaunchModal(false)
      setLaunchData({ name: '', calls_per_minute: 5, schedule_type: 'now', language: 'auto' })
      const data = await campaignsApi.list(company.id)
      setCampaigns(data.campaigns || [])
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to launch campaign' })
    }
  }

  const handlePause = async (id: string) => {
    try {
      await campaignsApi.pause(id)
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'paused' } : c)))
      addToast({ type: 'info', message: 'Campaign paused' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const handleResume = async (id: string) => {
    try {
      await campaignsApi.resume(id)
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'running' } : c)))
      addToast({ type: 'success', message: 'Campaign resumed' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const handleForceComplete = async (id: string) => {
    try {
      await campaignsApi.forceComplete(id)
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'completed' } : c)))
      addToast({ type: 'info', message: 'Campaign completed' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const estimatedContacts = 500

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Campaigns</h2>
          <p className="text-sm text-text-tertiary">{campaigns.length} total campaigns</p>
        </div>
        <Button onClick={() => setShowLaunchModal(true)} icon={<Plus size={16} />}>
          Launch Campaign
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs tabs={allFilterTabs} activeTab={filter} onChange={setFilter} />

      {/* Campaign grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Megaphone size={40} className="text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">No campaigns found</p>
          <Button variant="secondary" className="mt-4" onClick={() => setShowLaunchModal(true)}>
            Create your first campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((campaign) => {
            const total = campaign.total_contacts || 1
            const progress = Math.round(
              ((campaign.connected + campaign.unreachable + campaign.invalid_count) / total) * 100,
            )
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 min-w-0">
                      <CardTitle className="truncate">{campaign.name}</CardTitle>
                      <Badge variant={statusBadgeVariant[campaign.status] || 'default'} dot pulse={campaign.status === 'running'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <button
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </CardHeader>

                  <p className="text-xs text-text-tertiary mb-4">
                    Created {formatDate(campaign.created_at)} · {campaign.total_contacts || 0} contacts
                  </p>

                  <Progress value={progress} showLabel className="mb-4" variant={campaign.status === 'failed' ? 'error' : 'default'} />

                  <div className="grid grid-cols-4 gap-2 text-center mb-4">
                    {[
                      { label: 'Called', value: campaign.connected + campaign.unreachable + campaign.invalid_count },
                      { label: 'Connected', value: campaign.connected },
                      { label: 'Hot Leads', value: campaign.hot_leads || 0 },
                      { label: 'Unreachable', value: campaign.unreachable },
                    ].map((stat) => (
                      <div key={stat.label} className="p-2 rounded-lg bg-bg-surface">
                        <p className="text-sm font-semibold text-text-primary">{stat.value}</p>
                        <p className="text-[10px] text-text-tertiary">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      View Details
                    </Button>
                    {campaign.status === 'running' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePause(campaign.id)}
                        icon={<Pause size={14} />}
                      />
                    ) : campaign.status === 'paused' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResume(campaign.id)}
                        icon={<Play size={14} />}
                      />
                    ) : null}
                    {(campaign.status === 'running' || campaign.status === 'paused') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleForceComplete(campaign.id)}
                        icon={<XCircle size={14} />}
                        className="text-text-tertiary"
                      />
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Launch Modal */}
      <Modal open={showLaunchModal} onClose={() => setShowLaunchModal(false)} title="Launch Campaign" maxWidth="md">
        <div className="space-y-4">
          <Input
            label="Campaign Name"
            value={launchData.name}
            onChange={(e) => setLaunchData((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g., Q1 Follow-up"
          />

          <div className="p-3 rounded-lg bg-bg-surface border border-border-default">
            <p className="text-sm text-text-secondary mb-1">Contact List</p>
            <p className="text-sm text-text-primary">All Contacts ({estimatedContacts})</p>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Calls per minute: {launchData.calls_per_minute}</label>
            <input
              type="range"
              min="1"
              max="20"
              value={launchData.calls_per_minute}
              onChange={(e) => setLaunchData((p) => ({ ...p, calls_per_minute: Number(e.target.value) }))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setLaunchData((p) => ({ ...p, schedule_type: 'now' }))}
              className={`flex-1 p-3 rounded-lg border text-sm text-left transition-all ${
                launchData.schedule_type === 'now'
                  ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                  : 'border-border-default bg-bg-surface text-text-secondary'
              }`}
            >
              <Play size={16} className="mb-1" />
              <p className="font-medium">Now</p>
              <p className="text-xs text-text-tertiary">Start immediately</p>
            </button>
            <button
              onClick={() => setLaunchData((p) => ({ ...p, schedule_type: 'later' }))}
              className={`flex-1 p-3 rounded-lg border text-sm text-left transition-all ${
                launchData.schedule_type === 'later'
                  ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                  : 'border-border-default bg-bg-surface text-text-secondary'
              }`}
            >
              <Clock size={16} className="mb-1" />
              <p className="font-medium">Schedule</p>
              <p className="text-xs text-text-tertiary">Pick date & time</p>
            </button>
          </div>

          <p className="text-xs text-text-tertiary">
            Estimated time: ~{(estimatedContacts / (launchData.calls_per_minute * 60)).toFixed(1)} hours
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowLaunchModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleLaunch} disabled={!launchData.name}>
              Launch Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CampaignsTab
