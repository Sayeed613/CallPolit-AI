export const INDUSTRIES = [
  { value: 'banking', label: 'Banking' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
] as const

export const MODES = [
  { value: 'outbound', label: 'Outbound', desc: 'Make calls to customers' },
  { value: 'inbound', label: 'Inbound', desc: 'Receive calls from customers' },
  { value: 'both', label: 'Both', desc: 'Complete customer support' },
] as const

export const VERIFICATION_LEVELS = [
  { value: 1, label: 'Basic', desc: 'Name and mobile only', icon: '🟢' },
  { value: 2, label: 'Standard', desc: 'OTP verification', icon: '🟡' },
  { value: 3, label: 'Strict', desc: 'Full KYC verification', icon: '🔴' },
] as const

export const LANGUAGES = [
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'en-IN', label: 'English' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'all', label: 'All Languages' },
] as const

export const CAMPAIGN_STATUSES = [
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'paused', label: 'Paused' },
  { value: 'draft', label: 'Draft' },
] as const

export const APPOINTMENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
] as const

export const CONTACT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'called', label: 'Called' },
  { value: 'connected', label: 'Connected' },
  { value: 'unreachable', label: 'Unreachable' },
  { value: 'invalid', label: 'Invalid' },
] as const

export const PLANS = [
  { value: 'free', label: 'Free', calls: 100, contacts: 500, storage: '100 MB' },
  { value: 'starter', label: 'Starter', calls: 1000, contacts: 5000, storage: '1 GB' },
  { value: 'growth', label: 'Growth', calls: 10000, contacts: 50000, storage: '10 GB' },
  { value: 'enterprise', label: 'Enterprise', calls: -1, contacts: -1, storage: 'Unlimited' },
] as const

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Live Calls', path: '/live', icon: 'Radio', badge: 'live' },
  { label: 'Campaigns', path: '/campaigns', icon: 'Megaphone' },
  { label: 'Contacts', path: '/contacts', icon: 'Users' },
  { label: 'Analytics', path: '/analytics', icon: 'BarChart3' },
  { label: 'Documents', path: '/documents', icon: 'FileText' },
  { label: 'Appointments', path: '/appointments', icon: 'Calendar' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
] as const
