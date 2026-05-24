import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TOS() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-text-primary mb-6">Terms of Service</h1>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <p>
            These Terms of Service govern your use of the CallPilot AI platform. By using our service,
            you agree to these terms.
          </p>

          <h2 className="text-lg font-semibold text-text-primary">1. Service Description</h2>
          <p>
            CallPilot AI provides AI-powered voice calling services for businesses. We make automated
            calls using artificial intelligence to communicate with your customers in multiple Indian languages.
          </p>

          <h2 className="text-lg font-semibold text-text-primary">2. User Obligations</h2>
          <p>
            You agree to use the service in compliance with all applicable laws and regulations,
            including telecom regulations and data protection laws. You must not use the service for
            spam, fraud, or any illegal purpose.
          </p>

          <h2 className="text-lg font-semibold text-text-primary">3. Data Privacy</h2>
          <p>
            We process customer data in accordance with our Privacy Policy. You retain ownership of
            your data. We implement reasonable security measures to protect your information.
          </p>

          <h2 className="text-lg font-semibold text-text-primary">4. Service Level</h2>
          <p>
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. We may
            perform maintenance that temporarily affects availability.
          </p>

          <h2 className="text-lg font-semibold text-text-primary">5. Limitation of Liability</h2>
          <p>
            CallPilot AI shall not be liable for indirect, incidental, or consequential damages.
            Our total liability shall not exceed the amount paid by you in the 12 months preceding
            the claim.
          </p>

          <p className="text-text-tertiary mt-8">
            Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TOS
