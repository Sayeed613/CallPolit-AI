import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ParticleBackground } from '../components/three/ParticleBackground'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../stores/authStore'
import { useCompanyStore } from '../stores/companyStore'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuthStore()
  const { fetchCompanies } = useCompanyStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      await fetchCompanies()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password')
      setShake(true)
      setTimeout(() => setShake(false), 500)
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
        className={`relative z-10 w-full max-w-md ${shake ? 'animate-shake' : ''}`}
      >
        <div className="rounded-2xl border border-surface-border/50 bg-surface-card/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 shadow-lg shadow-brand-500/20">
              <span className="text-2xl">📞</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">CallPilot AI</h1>
            <p className="mt-1 text-sm text-text-muted">AI-powered customer support platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-text-muted transition-colors hover:text-brand-400"
            >
              Forgot password?
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-text-muted">
              New to CallPilot?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-medium text-brand-400 transition-colors hover:text-brand-300"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
