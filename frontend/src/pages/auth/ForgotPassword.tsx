import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Phone, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import useAuthStore from '../../stores/authStore'

export function ForgotPassword() {
  const { resetPassword, loading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await resetPassword(email)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-4">
            <Phone size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Reset password</h1>
          <p className="text-sm text-text-tertiary mt-1">
            {sent ? 'Check your email for the reset link' : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="bg-bg-card border border-border-default rounded-xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full bg-success-muted border border-success/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle size={32} className="text-success" />
              </motion.div>
              <p className="text-sm text-text-secondary mb-6">
                If an account exists with that email, we've sent a password reset link.
              </p>
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft size={16} />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                Send reset link
              </Button>

              <Link to="/login">
                <Button variant="ghost" className="w-full mt-2">
                  <ArrowLeft size={16} />
                  Back to sign in
                </Button>
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
