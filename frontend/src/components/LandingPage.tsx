import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ParticleBackground } from './three/ParticleBackground'
import { Button } from './ui/Button'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <ParticleBackground />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-600">
            <span className="text-lg">📞</span>
          </div>
          <span className="text-lg font-bold text-text-primary">CallPilot AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-6 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
            AI-Powered Customer Support for Indian Businesses
          </span>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-text-primary md:text-7xl">
            Your AI Call Center
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              Never Miss a Call
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-text-muted">
            CallPilot AI handles inbound and outbound calls in Hindi, English, and Kannada.
            Verify customers, resolve queries, book appointments — all powered by AI.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="secondary">
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: '🎙',
              title: 'Outbound Campaigns',
              desc: 'Launch AI-powered calling campaigns at scale. Connect with thousands of customers in minutes.',
            },
            {
              icon: '📞',
              title: 'Inbound Call Handling',
              desc: 'AI answers every call 24/7. Verify identity, resolve queries, and take action automatically.',
            },
            {
              icon: '🔐',
              title: 'Customer Verification',
              desc: 'Multi-level verification with OTP, name confirmation, and KYC for banking-grade security.',
            },
            {
              icon: '🌐',
              title: 'Hindi & English & Kannada',
              desc: 'Speak your customers\' language. AI understands and responds in Hindi, English, and Kannada.',
            },
            {
              icon: '📊',
              title: 'Live Call Monitoring',
              desc: 'Watch calls happen in real time. Intervene when needed. Track every interaction.',
            },
            {
              icon: '🔗',
              title: 'CRM Integrations',
              desc: 'Connect with your existing tools. Import contacts, sync data, automate workflows.',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-2xl border border-surface-border bg-surface-card/60 p-6 backdrop-blur-sm transition-all hover:border-zinc-600/50 hover:bg-surface-card/80"
            >
              <span className="mb-3 block text-3xl">{feature.icon}</span>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-border py-8 text-center text-sm text-text-muted">
        <p>&copy; 2026 CallPilot AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
