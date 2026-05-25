import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Tabs from '../../components/ui/Tabs'
import Badge from '../../components/ui/Badge'
import useCompanyStore from '../../stores/companyStore'
import { companyApi } from '../../lib/api'

const settingsTabs = [
  { value: 'company', label: 'Company' },
  { value: 'verification', label: 'Verification' },
  { value: 'voice', label: 'Voice & AI' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'billing', label: 'Billing' },
]

export function Settings() {
  const { tab } = useParams<{ tab: string }>()
  const navigate = useNavigate()
  const { company, updateCompany } = useCompanyStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const activeTab = tab && settingsTabs.find((t) => t.value === tab) ? tab : 'company'

  const handleTabChange = (value: string) => {
    navigate(`/settings/${value}`)
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
    if (company) {
      setForm({
        name: company.name || '',
        industry: company.industry || '',
        verificationLevel: company.verification_level || 1,
        languagePreference: (Array.isArray(company.language_preference) ? company.language_preference[0] : company.language_preference) || 'hi-IN',
        escalationPhone: company.escalation_phone || '',
        businessHoursStart: company.business_hours_start || '09:00',
        businessHoursEnd: company.business_hours_end || '21:00',
        afterHoursMessage: company.after_hours_message || '',
      })
    }
  }, [company])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (company?.id) {
        await companyApi.update(company.id, form)
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
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <p className="text-sm text-text-tertiary">Manage your account and preferences</p>
        </div>
      </div>

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
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  value={form.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))}
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p) => ({ ...p, industry: e.target.value }))}
                />
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={form.businessHoursStart}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, businessHoursStart: e.target.value }))}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={form.businessHoursEnd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, businessHoursEnd: e.target.value }))}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="After Hours Message"
                  value={form.afterHoursMessage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, afterHoursMessage: e.target.value }))}
                  placeholder="We are currently closed. Please call back during business hours."
                />
              </div>
            </Card>

            <Card className="border-error/20 p-6">
              <CardHeader>
                <CardTitle className="text-error">Danger Zone</CardTitle>
              </CardHeader>
              <p className="mb-4 text-sm text-text-tertiary">
                Permanently delete your company and all associated data.
              </p>
              <Button variant="secondary" className="border-error/30 text-error hover:bg-error/10">
                Delete Company
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Verification Level</CardTitle>
              </CardHeader>
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
                        : 'border-border-default hover:border-strong'
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
                      <p className="text-sm text-text-tertiary">{level.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'voice' && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Voice & AI Settings</CardTitle>
            </CardHeader>
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p) => ({ ...p, languagePreference: e.target.value }))}
              />
              <Input
                label="Escalation Phone Number"
                value={form.escalationPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, escalationPhone: e.target.value }))}
                placeholder="+91 9876543210"
              />
            </div>
          </Card>
        )}

        {activeTab === 'integrations' && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-bg-elevated p-4">
                <div>
                  <p className="font-medium text-text-primary">Twilio</p>
                  <p className="text-sm text-text-tertiary">Voice calls and SMS</p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-bg-elevated p-4">
                <div>
                  <p className="font-medium text-text-primary">WhatsApp Business</p>
                  <p className="text-sm text-text-tertiary">WhatsApp messaging</p>
                </div>
                <Badge variant="warning">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-bg-elevated p-4">
                <div>
                  <p className="font-medium text-text-primary">Google Gemini</p>
                  <p className="text-sm text-text-tertiary">AI conversation engine</p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Billing & Usage</CardTitle>
            </CardHeader>
            <div className="mb-6 rounded-lg bg-bg-elevated p-4">
              <p className="text-sm text-text-tertiary">Current Plan</p>
              <p className="text-2xl font-bold text-text-primary">Growth</p>
              <p className="text-sm text-text-tertiary">₹9,999/month</p>
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
              className="text-sm text-success"
            >
              Changes saved successfully
            </motion.span>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Settings
