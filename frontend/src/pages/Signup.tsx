import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, ArrowLeft, Mail, Lock, User, Building2, Globe } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import ParticleBackground from '../components/three/ParticleBackground'
import useAuthStore from '../stores/authStore'
import { INDUSTRIES } from '../lib/constants'

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export function Signup() {
  const navigate = useNavigate()
  const { signUp, loading, error, rateLimited, rateLimitCountdown, clearError } = useAuthStore()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleNext = () => {
    if (step === 0) {
      if (!name || !email || !companyName) return
    }
    setDirection(1)
    setStep(1)
  }

  const handleBack = () => {
    setDirection(-1)
    setStep(0)
  }

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
    // Only navigate if sign-up succeeded
    if (!useAuthStore.getState().error && useAuthStore.getState().user) {
      navigate('/dashboard')
    }
  }

  // Circular progress ring for rate limit
  const circumference = 2 * Math.PI * 20
  const progress = rateLimited ? (rateLimitCountdown / 60) * circumference : circumference

  return (
    <div className="relative min-h-screen bg-bg-base flex items-center justify-center p-4 overflow-hidden">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-4">
            <Phone size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Create account</h1>
          <p className="text-sm text-text-tertiary mt-1">Get started with CallPilot AI</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-brand-400' : 'bg-border-default'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait" custom={direction}>
              {step === 0 ? (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<User size={16} />}
                    placeholder="John Doe"
                    required
                    disabled={loading}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={16} />}
                    placeholder="you@company.com"
                    required
                    disabled={loading}
                  />
                  <Input
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    icon={<Building2 size={16} />}
                    placeholder="Your Business"
                    required
                    disabled={loading}
                  />
                  <Select
                    label="Industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                    placeholder="Select industry"
                    disabled={loading}
                  />
                  <Button type="button" className="w-full mt-2" onClick={handleNext}>
                    Continue
                    <ArrowRight size={16} />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock size={16} />}
                    placeholder="Min. 6 characters"
                    required
                    disabled={loading || rateLimited}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock size={16} />}
                    placeholder="Repeat password"
                    required
                    disabled={loading || rateLimited}
                  />

                  {passwordError && (
                    <p className="text-xs text-error">{passwordError}</p>
                  )}

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-error"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Rate limit countdown */}
                  {rateLimited && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-warning-muted border border-warning/20">
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="absolute inset-0 -rotate-90" width="40" height="40">
                          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="3" />
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="rgb(245,158,11)"
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={progress}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <span className="text-sm font-semibold text-warning">{rateLimitCountdown}s</span>
                      </div>
                      <div className="text-xs text-warning">
                        Too many attempts. Please wait before trying again.
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" onClick={handleBack} disabled={loading}>
                      <ArrowLeft size={16} />
                      Back
                    </Button>
                    <Button type="submit" loading={loading} disabled={rateLimited} className="flex-1">
                      Create account
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-text-tertiary bg-bg-card">or</span>
            </div>
          </div>

          <Link to="/login">
            <Button variant="secondary" className="w-full">
              Sign in instead
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Signup
