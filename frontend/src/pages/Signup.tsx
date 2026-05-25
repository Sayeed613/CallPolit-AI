import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, Lock, Mail, Phone, User } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import useAuthStore from '../stores/authStore'
import { INDUSTRIES } from '../lib/constants'

export function Signup() {
  const navigate = useNavigate()
  const { signUp, loading, error, rateLimited, rateLimitCountdown, clearError } = useAuthStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    clearError()

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    await signUp(email, password, name, companyName, industry)
    if (!useAuthStore.getState().error && useAuthStore.getState().user) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-white p-9 shadow-card">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
            <Phone size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Create account</h1>
          <p className="mt-1 text-sm text-ink-3">Get started with CallPilot AI</p>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {[0, 1].map((value) => <span key={value} className={`h-1.5 w-8 rounded-full ${value <= step ? 'bg-brand-500' : 'bg-border'}`} />)}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 0 ? (
            <>
              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={16} />} required disabled={loading} />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} required disabled={loading} />
              <Input label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} icon={<Building2 size={16} />} required disabled={loading} />
              <Select label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} options={INDUSTRIES.map((i) => ({ value: i, label: i }))} placeholder="Select industry" disabled={loading} />
              <Button type="button" className="w-full" onClick={() => setStep(1)} disabled={!name || !email || !companyName}>
                Continue
                <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} required disabled={loading || rateLimited} />
              <Input label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock size={16} />} required disabled={loading || rateLimited} />
              {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
              {error && <p className="text-xs text-danger">{error}</p>}
              {rateLimited && <p className="rounded-md bg-warning-bg p-3 text-xs text-warning">Too many attempts. Try again in {rateLimitCountdown}s.</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(0)} disabled={loading}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button type="submit" loading={loading} disabled={rateLimited} className="flex-1">
                  Create account
                </Button>
              </div>
            </>
          )}
        </form>

        <div className="my-6 border-t border-border" />

        <Link to="/login">
          <Button variant="secondary" className="w-full">
            Sign in instead
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Signup
