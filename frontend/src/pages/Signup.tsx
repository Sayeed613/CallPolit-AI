import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ParticleBackground } from '../components/three/ParticleBackground'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

const industries = [
  { value: 'banking', label: 'Banking' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
]

export function Register() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    industry: '',
  })

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(form.email, form.password, form.name, form.companyName, form.industry)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.message || ''
      const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.includes('429') || msg.toLowerCase().includes('too many requests')
      if (isRateLimit) {
        setError('Too many sign-up attempts. Try a different email or wait about an hour and try again.')
      } else {
        setError(msg || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface">
      <ParticleBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl border border-surface-border/50 bg-surface-card/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 shadow-lg shadow-brand-500/20">
              <span className="text-2xl">📞</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Create Account</h1>
            <p className="mt-1 text-sm text-text-muted">Get started with CallPilot AI</p>
          </div>

          {/* Progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition-colors ${
                  s <= step ? 'bg-brand-500' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Input
                  label="Full Name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
                <Input
                  label="Company Name"
                  placeholder="Your company"
                  value={form.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                  required
                />
                <Select
                  label="Industry"
                  options={industries}
                  value={form.industry}
                  onChange={(v) => update('industry', v)}
                  placeholder="Select industry"
                />
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!form.name || !form.email || !form.companyName || !form.industry}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  required
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" loading={loading}>
                    Create Account
                  </Button>
                </div>
              </motion.div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-text-muted">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-brand-400 transition-colors hover:text-brand-300"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
