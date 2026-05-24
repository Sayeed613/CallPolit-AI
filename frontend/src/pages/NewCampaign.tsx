import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useToast } from '../components/ui/Toast'
import { campaignsApi } from '../lib/api'
import useCompanyStore from '../stores/companyStore'
import { LANGUAGES } from '../lib/constants'

export function NewCampaign() {
  const navigate = useNavigate()
  const { company } = useCompanyStore()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    calls_per_minute: 5,
    language: 'auto',
    schedule_type: 'now' as 'now' | 'later',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company?.id || !form.name) return

    setLoading(true)
    try {
      const result = await campaignsApi.create({
        company_id: company.id,
        ...form,
      })
      await campaignsApi.launch(result.id)
      addToast({ type: 'success', message: 'Campaign launched!' })
      navigate(`/campaigns/${result.id}`)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to create campaign' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/campaigns')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to campaigns
      </button>

      <div>
        <h1 className="text-xl font-bold text-text-primary">New Campaign</h1>
        <p className="text-sm text-text-tertiary mt-1">Configure your outbound calling campaign</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Q1 Follow-up Calls"
              required
            />

            <Select
              label="Language"
              value={form.language}
              onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
              options={[
                { value: 'auto', label: 'Auto-detect' },
                ...LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
              ]}
            />

            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Calls per minute: {form.calls_per_minute}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={form.calls_per_minute}
                onChange={(e) => setForm((p) => ({ ...p, calls_per_minute: Number(e.target.value) }))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>1 (slow)</span>
                <span>20 (fast)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant={form.schedule_type === 'now' ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => setForm((p) => ({ ...p, schedule_type: 'now' }))}
              >
                Start Now
              </Button>
              <Button
                type="button"
                variant={form.schedule_type === 'later' ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => setForm((p) => ({ ...p, schedule_type: 'later' }))}
              >
                Schedule Later
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => navigate('/campaigns')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={<Play size={16} />}>
            Launch Campaign
          </Button>
        </div>
      </form>
    </div>
  )
}

export default NewCampaign
