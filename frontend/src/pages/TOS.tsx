import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ParticleBackground } from '../components/three/ParticleBackground'
import { Button } from '../components/ui/Button'

export function TOS() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-surface">
      <ParticleBackground />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <Button variant="secondary" onClick={() => navigate('/register')}>
              ← Back
            </Button>
          </div>
          <h1 className="mb-8 text-4xl font-bold text-text-primary">Terms of Service</h1>

          <div className="space-y-6 text-text-secondary">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-text-primary">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using CallPilot AI ("the Service"), you agree to be bound by these
                Terms of Service. If you do not agree with any part of these terms, you may not use
                the Service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-text-primary">2. Description of Service</h2>
              <p className="leading-relaxed">
                CallPilot AI provides AI-powered voice calling and customer support automation
                for businesses. The Service includes outbound calling campaigns, inbound call
                handling, customer verification, appointment scheduling, and analytics.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-text-primary">3. Use of Service</h2>
              <p className="leading-relaxed">
                You agree to use the Service only for lawful purposes and in accordance with
                applicable Indian telecommunications regulations (TRAI) and data protection
                laws (DPDP Act 2023).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-text-primary">4. Data Privacy</h2>
              <p className="leading-relaxed">
                We process customer call data and personal information in accordance with our
                Privacy Policy. You retain ownership of your data. We implement industry-standard
                security measures to protect all data processed through the Service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-text-primary">5. Limitation of Liability</h2>
              <p className="leading-relaxed">
                CallPilot AI shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages arising from your use of the Service.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
