import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Phone, Shield, Globe, FileText, BarChart3, Bell, Users } from 'lucide-react'
import ParticleBackground from './three/ParticleBackground'
import Button from './ui/Button'

const features = [
  {
    icon: Phone,
    title: 'AI Voice Calling',
    description: 'Make thousands of calls simultaneously with natural AI conversations in Hindi, English, and Kannada.',
  },
  {
    icon: Shield,
    title: 'Multi-Level Verification',
    description: 'Verify customer identities with OTP, name, DOB, PAN, and Aadhaar matching.',
  },
  {
    icon: Globe,
    title: 'Multilingual Support',
    description: 'Speak your customers\' language. Supports 9 Indian languages with native accents.',
  },
  {
    icon: FileText,
    title: 'Document RAG',
    description: 'Upload PDFs and documents. AI answers questions from your knowledge base.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track call metrics, connection rates, sentiment analysis, and campaign performance.',
  },
  {
    icon: Bell,
    title: 'Smart Escalation',
    description: 'Detect frustrated customers and seamlessly escalate to human agents.',
  },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-bg-base overflow-hidden">
      <ParticleBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <Phone size={20} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-text-primary">CallPilot AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/signup')}>
            Get Started
            <ArrowRight size={14} />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full pulse-dot" />
            AI-Powered Voice Calling Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6">
            Automate calls in{' '}
            <span className="gradient-text">Indian languages</span>
            <br />
            with AI
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
            CallPilot AI makes thousands of calls simultaneously in Hindi, English, Kannada, and more.
            Verify customers, book appointments, and collect payments — fully automated.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Start Free Trial
              <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" size="lg">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            {[
              { value: '10K+', label: 'Calls/Day' },
              { value: '9', label: 'Languages' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-tertiary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Everything you need to scale outreach
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              From voice calls to document analysis, CallPilot handles the complexity so you can focus on growth.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="glass-card p-6 hover:border-white/[0.12] transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-brand-400" />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Ready to transform your calling?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Join businesses across India using CallPilot AI to automate customer outreach.
            </p>
            <Button size="lg" onClick={() => navigate('/signup')}>
              Get Started Free
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-subtle py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Phone size={14} />
            <span>CallPilot AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-tertiary">
            <a href="/tos" className="hover:text-text-secondary transition-colors">Terms</a>
            <span>&copy; {new Date().getFullYear()} CallPilot AI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
