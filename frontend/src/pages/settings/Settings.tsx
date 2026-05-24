import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Switch } from '../../components/ui/Switch'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { Badge } from '../../components/ui/Badge'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useCompanyStore } from '../../stores/companyStore'
import { api } from '../../lib/api'

const settingsTabs = [
  { id: 'company', label: 'Company' },
  { id: 'verification', label: 'Verification' },
  { id: 'voice', label: 'Voice & AI' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'billing', label: 'Billing' },
]

export function Settings() {
  const { tab } = useParams<{ tab: string }>()
  const navigate = useNavigate()
  const { activeCompany, updateCompany } = useCompanyStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const activeTab = tab && settingsTabs.find((t) => t.id === tab) ? tab : 'company'

  const handleTabChange = (id: string) => {
    navigate(`/settings/${id}`)
  }

  const [form, setForm] = useState({
    name: '',
    industry: '',
    verificationLevel: 1,
    languagePreference: 'hi-IN',
    escalationPhone: '',
    businessHoursStart: '09:00',
    businessHoursEnd: '21:00',
    afterHoursMessage: '',
  })

  useEffect(() => {
    if (activeCompany) {
      setForm({
        name: activeCompany.name || '',
        industry: activeCompany.industry || '',
        verificationLevel: activeCompany.verification_level || 1,
        languagePreference: activeCompany.language_preference || 'hi-IN',
        escalationPhone: activeCompany.escalation_phone || '',
        businessHoursStart: activeCompany.business_hours_start || '09:00',
        businessHoursEnd: activeCompany.business_hours_end || '21:00',
        afterHoursMessage: activeCompany.after_hours_message || '',
      })
    }
  }, [activeCompany])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeCompany?.id) {
        await api.company.update(activeCompany.id, form)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // handle error
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageWrapper title="Settings" subtitle="Manage your account and preferences">
      <Tabs tabs={settingsTabs} activeTab={activeTab} onChange={handleTabChange} className="mb-8" />

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        {activeTab === 'company' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Company Information</h3>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Select
                  label="Industry"
                  options={[
                    { value: 'banking', label: 'Banking' },
                    { value: 'telecom', label: 'Telecom' },
                    { value: 'insurance', label: 'Insurance' },
                    { value: 'healthcare', label: 'Healthcare' },
                    { value: 'ecommerce', label: 'E-commerce' },
                    { value: 'real_estate', label: 'Real Estate' },
                    { value: 'education', label: 'Education' },
                    { value: 'general', label: 'General' },
                  ]}
                  value={form.industry}
                  onChange={(v) => setForm((p) => ({ ...p, industry: v }))}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Business Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={form.businessHoursStart}
                  onChange={(e) => setForm((p) => ({ ...p, businessHoursStart: e.target.value }))}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={form.businessHoursEnd}
                  onChange={(e) => setForm((p) => ({ ...p, businessHoursEnd: e.target.value }))}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="After Hours Message"
                  value={form.afterHoursMessage}
                  onChange={(e) => setForm((p) => ({ ...p, afterHoursMessage: e.target.value }))}
                  placeholder="We are currently closed. Please call back during business hours."
                />
              </div>
            </Card>

            <Card className="p-6 border-red-500/20">
              <h3 className="mb-2 text-lg font-semibold text-red-400">Danger Zone</h3>
              <p className="mb-4 text-sm text-text-muted">
                Permanently delete your company and all associated data.
              </p>
              <Button variant="secondary" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                Delete Company
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Verification Level</h3>
              <div className="space-y-3">
                {[
                  { level: 1, label: 'Basic', desc: 'Phone number match + name confirmation', icon: '🟢' },
                  { level: 2, label: 'Standard', desc: 'OTP verification + date of birth', icon: '🟡' },
                  { level: 3, label: 'Strict', desc: 'Full KYC — PAN, Aadhaar, account details', icon: '🔴' },
                ].map((level) => (
                  <label
                    key={level.level}
                    className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all ${
                      form.verificationLevel === level.level
                        ? 'border-brand-500 bg-brand-500/5'
                        : 'border-surface-border hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="verificationLevel"
                      value={level.level}
                      checked={form.verificationLevel === level.level}
                      onChange={() => setForm((p) => ({ ...p, verificationLevel: level.level }))}
                      className="mt-1 accent-brand-500"
                    />
                    <div>
                      <p className="font-medium text-text-primary">{level.icon} {level.label}</p>
                      <p className="text-sm text-text-muted">{level.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'voice' && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Voice & AI Settings</h3>
            <div className="space-y-4">
              <Select
                label="Language Preference"
                options={[
                  { value: 'hi-IN', label: 'Hindi' },
                  { value: 'en-IN', label: 'English' },
                  { value: 'kn-IN', label: 'Kannada' },
                  { value: 'auto', label: 'Auto-detect all' },
                ]}
                value={form.languagePreference}
                onChange={(v) => setForm((p) => ({ ...p, languagePreference: v }))}
              />
              <Input
                label="Escalation Phone Number"
                value={form.escalationPhone}
                onChange={(e) => setForm((p) => ({ ...p, escalationPhone: e.target.value }))}
                placeholder="+91 9876543210"
              />
            </div>
          </Card>
        )}

        {activeTab === 'integrations' && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Integrations</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-4">
                <div>
                  <p className="font-medium text-text-primary">Twilio</p>
                  <p className="text-sm text-text-muted">Voice calls and SMS</p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-4">
                <div>
                  <p className="font-medium text-text-primary">WhatsApp Business</p>
                  <p className="text-sm text-text-muted">WhatsApp messaging</p>
                </div>
                <Badge variant="warning">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-4">
                <div>
                  <p className="font-medium text-text-primary">Google Gemini</p>
                  <p className="text-sm text-text-muted">AI conversation engine</p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Billing & Usage</h3>
            <div className="mb-6 rounded-lg bg-surface-secondary p-4">
              <p className="text-sm text-text-muted">Current Plan</p>
              <p className="text-2xl font-bold text-text-primary">Growth</p>
              <p className="text-sm text-text-muted">₹9,999/month</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Calls this month</span>
                <span className="text-sm font-medium text-text-primary">1,234 / 5,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Contacts stored</span>
                <span className="text-sm font-medium text-text-primary">856 / 10,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Storage used</span>
                <span className="text-sm font-medium text-text-primary">245 MB / 1 GB</span>
              </div>
            </div>
            <div className="mt-6">
              <Button className="w-full">Upgrade Plan</Button>
            </div>
          </Card>
        )}

        {/* Save Button */}
        <div className="mt-8 flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
          {saved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-emerald-400"
            >
              Changes saved successfully
            </motion.span>
          )}
        </div>
      </motion.div>
    </PageWrapper>
  )
}
