import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Phone, ArrowRight, Mail, Lock } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ParticleBackground from '../components/three/ParticleBackground'
import useAuthStore from '../stores/authStore'

export function Login() {
  const navigate = useNavigate()
  const { signIn, loading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await signIn(email, password)
    // Only navigate if sign-in succeeded (no error was set)
    if (!useAuthStore.getState().error && useAuthStore.getState().user) {
      navigate('/dashboard')
    }
  }

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
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-4"
          >
            <Phone size={24} className="text-white" />
          </motion.div>
          <h1 className="text-xl font-bold text-text-primary">CallPilot AI</h1>
          <p className="text-sm text-text-tertiary mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className={`bg-bg-card border rounded-xl p-6 transition-all duration-300 ${
            error ? 'border-error/50 animate-shake' : 'border-border-default'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-error"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign in
              <ArrowRight size={16} />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-text-tertiary bg-bg-card">or</span>
            </div>
          </div>

          <Link to="/signup">
            <Button variant="secondary" className="w-full">
              Create account
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
