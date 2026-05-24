export const LANGUAGES = [
  { value: 'hindi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'kannada', label: 'Kannada', flag: '🇮🇳' },
  { value: 'tamil', label: 'Tamil', flag: '🇮🇳' },
  { value: 'telugu', label: 'Telugu', flag: '🇮🇳' },
  { value: 'malayalam', label: 'Malayalam', flag: '🇮🇳' },
  { value: 'bengali', label: 'Bengali', flag: '🇮🇳' },
  { value: 'gujarati', label: 'Gujarati', flag: '🇮🇳' },
  { value: 'marathi', label: 'Marathi', flag: '🇮🇳' },
]

export const INDUSTRIES = [
  'Banking & Finance',
  'Insurance',
  'Healthcare',
  'Real Estate',
  'Education',
  'E-commerce',
  'Logistics',
  'Telecommunications',
  'Hospitality',
  'Government Services',
  'Retail',
  'Manufacturing',
  'Technology',
  'Legal',
  'Consulting',
  'Other',
]

export const VERIFICATION_LEVELS = [
  {
    value: 1,
    label: 'Basic',
    description: 'Name + phone number match',
    color: 'text-success',
    bgColor: 'bg-success-muted',
    borderColor: 'border-success/30',
  },
  {
    value: 2,
    label: 'Standard',
    description: 'OTP + Date of birth verification',
    color: 'text-warning',
    bgColor: 'bg-warning-muted',
    borderColor: 'border-warning/30',
  },
  {
    value: 3,
    label: 'Strict',
    description: 'PAN + Aadhaar + Bank account details',
    color: 'text-error',
    bgColor: 'bg-error-muted',
    borderColor: 'border-error/30',
  },
]

export const CAMPAIGN_STATUSES = [
  { value: 'all', label: 'All', color: '' },
  { value: 'running', label: 'Running', color: 'text-success' },
  { value: 'completed', label: 'Completed', color: 'text-brand-400' },
  { value: 'paused', label: 'Paused', color: 'text-warning' },
  { value: 'failed', label: 'Failed', color: 'text-error' },
  { value: 'draft', label: 'Draft', color: 'text-text-tertiary' },
  { value: 'scheduled', label: 'Scheduled', color: 'text-info' },
]

export const CALL_STATUSES: Record<string, { label: string; color: string }> = {
  'in-progress': { label: 'In Progress', color: 'text-success' },
  completed: { label: 'Completed', color: 'text-brand-400' },
  'no-answer': { label: 'No Answer', color: 'text-warning' },
  busy: { label: 'Busy', color: 'text-warning' },
  failed: { label: 'Failed', color: 'text-error' },
  queued: { label: 'Queued', color: 'text-text-tertiary' },
  ringing: { label: 'Ringing', color: 'text-info' },
  missed: { label: 'Missed', color: 'text-error' },
}

export const APPOINTMENT_STATUSES: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-info' },
  confirmed: { label: 'Confirmed', color: 'text-success' },
  completed: { label: 'Completed', color: 'text-brand-400' },
  cancelled: { label: 'Cancelled', color: 'text-error' },
  'no-show': { label: 'No Show', color: 'text-warning' },
}

export const DOCUMENT_STATUSES: Record<string, { label: string; color: string }> = {
  processing: { label: 'Processing', color: 'text-warning' },
  ready: { label: 'Ready', color: 'text-success' },
  failed: { label: 'Failed', color: 'text-error' },
}

export const MODE_OPTIONS = [
  { value: 'inbound', label: 'Inbound', description: 'Receive incoming calls only' },
  { value: 'outbound', label: 'Outbound', description: 'Make outgoing calls only' },
  { value: 'both', label: 'Both', description: 'Inbound and outbound calling' },
]
