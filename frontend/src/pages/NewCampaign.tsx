import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { PageWrapper } from '../components/layout/PageWrapper'
import { api } from '../lib/api'
import { useCompanyStore } from '../stores/companyStore'

interface ContactList {
  id: string
  name: string
  count: number
}

export function NewCampaign() {
  const navigate = useNavigate()
  const { activeCompany } = useCompanyStore()
  const [loading, setLoading] = useState(false)
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    contactListId: '',
    callsPerMinute: 5,
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduledDate: '',
    scheduledTime: '',
    languageOverride: 'auto',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await api.contacts.list(activeCompany?.id || '')
        setContactLists([
          { id: 'all', name: 'All Contacts', count: res.count || 0 },
        ])
      } catch {
        // fallback
      }
    }
    load()
  }, [activeCompany?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.contactListId) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const campaign = await api.campaigns.launch(activeCompany?.id || '', form.name, form.callsPerMinute)
      navigate(`/campaigns/${campaign.campaign_id}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper
      title="Launch Campaign"
      subtitle="Configure and launch a new outbound calling campaign"
      actions={
        <Button variant="secondary" onClick={() => navigate('/campaigns')}>
          Cancel
        </Button>
      }
    >
      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Campaign Details</h3>
            <div className="space-y-4">
              <Input
                label="Campaign Name"
                placeholder="e.g., Winter Promotions"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Select
                label="Contact List"
                options={contactLists.map((cl) => ({
                  value: cl.id,
                  label: `${cl.name} (${cl.count} contacts)`,
                }))}
                value={form.contactListId}
                onChange={(v) => setForm((p) => ({ ...p, contactListId: v }))}
                placeholder="Select contact list"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Call Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Calls per minute: {form.callsPerMinute}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.callsPerMinute}
                  onChange={(e) => setForm((p) => ({ ...p, callsPerMinute: parseInt(e.target.value) }))}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
              <Select
                label="Schedule"
                options={[
                  { value: 'now', label: 'Launch Now' },
                  { value: 'scheduled', label: 'Schedule for later' },
                ]}
                value={form.scheduleType}
                onChange={(v) => setForm((p) => ({ ...p, scheduleType: v as 'now' | 'scheduled' }))}
              />
              {form.scheduleType === 'scheduled' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))}
                  />
                  <Input
                    label="Time"
                    type="time"
                    value={form.scheduledTime}
                    onChange={(e) => setForm((p) => ({ ...p, scheduledTime: e.target.value }))}
                  />
                </div>
              )}
              <Select
                label="Language Override (optional)"
                options={[
                  { value: 'auto', label: 'Auto-detect' },
                  { value: 'hi-IN', label: 'Hindi' },
                  { value: 'en-IN', label: 'English' },
                  { value: 'kn-IN', label: 'Kannada' },
                ]}
                value={form.languageOverride}
                onChange={(v) => setForm((p) => ({ ...p, languageOverride: v }))}
              />
            </div>
          </Card>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate('/campaigns')}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Launch Campaign
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  )
}
