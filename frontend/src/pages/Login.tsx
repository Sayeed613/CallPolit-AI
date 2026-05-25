import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, Phone } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
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
          <h1 className="text-2xl font-semibold text-ink">CallPilot AI</h1>
          <p className="mt-1 text-sm text-ink-3">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} placeholder="you@company.com" required disabled={loading} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} placeholder="Enter your password" required disabled={loading} />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            Sign in
            <ArrowRight size={16} />
          </Button>
        </form>

        <div className="my-6 border-t border-border" />

        <Link to="/signup">
          <Button variant="secondary" className="w-full">
            Create account
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Login
