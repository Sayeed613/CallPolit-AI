import { supabase } from './supabase'
import toast from 'react-hot-toast'

const API_BASE = ''

// ─── Types ──────────────────────────────────────────────

export interface Company {
  id: string
  user_id: string
  name: string
  industry: string
  mode: 'inbound' | 'outbound' | 'both'
  plan: string
  twilio_phone: string
  verification_level: number
  industry_type: string
  language_preference: string
  escalation_phone: string
  business_hours_start: string
  business_hours_end: string
  after_hours_message: string
  created_at: string
}

export interface Campaign {
  id: string
  company_id: string
  name: string
  status: string
  total_contacts: number
  called: number
  connected: number
  hot_leads: number
  unreachable: number
  invalid_count: number
  language: string
  launched_at: string
  completed_at: string | null
  created_at: string
}

export interface Contact {
  id: string
  company_id: string
  campaign_id: string | null
  name: string
  phone: string
  email: string | null
  status: string
  pan_last4: string | null
  aadhaar_last4: string | null
  date_of_birth: string | null
  account_number: string | null
  policy_number: string | null
  customer_id: string | null
  kyc_status: string
  risk_score: number
  is_vip: boolean
  outstanding_dues: number
  retry_count: number
  best_call_time: string | null
  created_at: string
}

export interface Document {
  id: string
  company_id: string
  file_name: string
  file_url: string | null
  status: string
  extracted_text: string | null
  created_at: string
}

export interface Appointment {
  id: string
  company_id: string
  customer_name: string
  customer_phone: string
  appointment_date: string
  appointment_time: string
  status: string
  source: string
  notes: string | null
  created_at: string
}

export interface LiveCall {
  call_sid: string
  contact_id: string | null
  campaign_id: string | null
  phone: string
  caller_number?: string
  duration_seconds: number
  duration?: number
  status: string
  verification_status: string
  language: string
  sentiment: string
  transcript: string
  ai_confidence: number
  is_human_handling?: boolean
  started_at: string
}

export interface CallLog {
  id: string
  twilio_call_sid: string
  contact_id: string | null
  campaign_id: string | null
  direction: string
  status: string
  duration_seconds: number
  transcript: string[]
  collected_data: Record<string, unknown>
  created_at: string
}

export interface WeeklyStats {
  calls_total: number
  calls_connected: number
  appointments_booked: number
  avg_duration_seconds: number
  connect_rate_pct: number
  hours_saved: number
}

export interface DailyTrend {
  date: string
  calls: number
  connected: number
  avg_duration: number
  appointments: number
}

// ─── API Client ─────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: Omit<RequestInit, 'body'> & { body?: unknown } = {}): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers as Record<string, string> || {}),
  }

  const config: RequestInit = {
    ...(options as Record<string, unknown>),
    headers,
  } as RequestInit

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body)
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config)

  if (res.status === 401) {
    supabase.auth.signOut()
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {
      try {
        detail = await res.text()
      } catch {}
    }
    throw new Error(detail)
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }
  return {} as T
}

async function uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      ...authHeaders,
    },
    body: formData,
  })

  if (!res.ok) {
    let detail = `Upload failed (${res.status})`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {}
    toast.error(detail)
    throw new Error(detail)
  }

  return res.json()
}

// ─── API Methods ────────────────────────────────────────

export const api = {
  // ── Company ─────────────────────────────────────────
  company: {
    create: (data: { name: string; industry: string; mode: string; plan?: string }) =>
      request<{ success: boolean; company_id: string; name: string; mode: string }>(
        '/api/company/create', { method: 'POST', body: data }
      ),
    get: (id: string) =>
      request<Company>(`/api/company/get/${id}`),
    list: () =>
      request<{ companies: Company[] }>('/api/company/list'),
    update: (id: string, data: Partial<Company>) =>
      request<{ success: boolean }>(`/api/company/update/${id}`, {
        method: 'PUT',
        body: data,
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/company/delete/${id}`, { method: 'DELETE' }),
  },

  // ── Documents ───────────────────────────────────────
  documents: {
    upload: (companyId: string, file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('company_id', companyId)
      return uploadFile<{ success: boolean; document_id: string; chunks_created: number; status: string }>(
        '/api/documents/upload', fd
      )
    },
    list: (companyId: string) =>
      request<{ documents: Document[] }>(`/api/documents/list/${companyId}`),
    delete: (documentId: string) =>
      request<{ success: boolean }>(`/api/documents/delete/${documentId}`, { method: 'DELETE' }),
    query: (companyId: string, question: string) =>
      request<{ question: string; chunks: { chunk_text: string; similarity: number }[] }>(
        '/api/documents/query', {
          method: 'POST',
          body: { company_id: companyId, question },
        }
      ),
  },

  // ── Contacts ────────────────────────────────────────
  contacts: {
    upload: (companyId: string, file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('company_id', companyId)
      return uploadFile<{ success: boolean; imported: number; skipped: number; total_rows: number }>(
        '/api/contacts/upload', fd
      )
    },
    list: (companyId: string) =>
      request<{ contacts: Contact[]; count: number }>(`/api/contacts/list/${companyId}`),
    get: (contactId: string) =>
      request<Contact>(`/api/contacts/get/${contactId}`),
    update: (contactId: string, data: Partial<Contact>) =>
      request<{ success: boolean }>(`/api/contacts/update/${contactId}`, {
        method: 'PUT',
        body: data,
      }),
    delete: (contactId: string) =>
      request<{ success: boolean }>(`/api/contacts/delete/${contactId}`, { method: 'DELETE' }),
  },

  // ── Campaigns ───────────────────────────────────────
  campaigns: {
    launch: (companyId: string, name: string, callsPerMinute: number) =>
      request<{ success: boolean; campaign_id: string; total_contacts: number; status: string }>(
        '/api/campaign/launch', {
          method: 'POST',
          body: { company_id: companyId, campaign_name: name, calls_per_minute: callsPerMinute },
        }
      ),
    list: (companyId: string) =>
      request<{ campaigns: Campaign[] }>(`/api/campaign/list/${companyId}`),
    get: (campaignId: string) =>
      request<Campaign>(`/api/campaign/get/${campaignId}`),
    stats: (campaignId: string) =>
      request<Record<string, unknown>>(`/api/campaign/stats/${campaignId}`),
    pause: (campaignId: string) =>
      request<{ success: boolean }>(`/api/campaign/pause/${campaignId}`, { method: 'POST' }),
    resume: (campaignId: string) =>
      request<{ success: boolean }>(`/api/campaign/resume/${campaignId}`, { method: 'POST' }),
    forceComplete: (campaignId: string) =>
      request<{ success: boolean }>(`/api/campaign/force-complete/${campaignId}`, { method: 'POST' }),
    callLogs: (campaignId: string) =>
      request<{ call_logs: CallLog[] }>(`/api/campaign/call-logs/${campaignId}`),
  },

  // ── Verification ────────────────────────────────────
  verification: {
    initiate: (companyId: string, phone: string) =>
      request<{ session_token: string; verification_level: number; questions: string[]; requires_otp: boolean }>(
        '/api/verify/initiate', {
          method: 'POST',
          body: { company_id: companyId, phone },
        }
      ),
    sendOtp: (companyId: string, phone: string) =>
      request<{ message: string; expires_in_seconds: number }>(
        '/api/verify/otp/send', {
          method: 'POST',
          body: { company_id: companyId, phone },
        }
      ),
    confirmOtp: (phone: string, otp: string) =>
      request<{ verified: boolean }>('/api/verify/otp/confirm', {
        method: 'POST',
        body: { phone, otp },
      }),
    getProfile: (companyId: string, phone: string) =>
      request<Contact>(`/api/verify/profile/${companyId}/${phone}`),
    lock: (companyId: string, phone: string) =>
      request<{ message: string }>('/api/verify/lock', {
        method: 'POST',
        body: { company_id: companyId, phone },
      }),
  },

  // ── Live Calls ──────────────────────────────────────
  live: {
    getActiveCalls: (companyId: string) =>
      request<{ calls: LiveCall[]; count: number }>(`/api/live/calls/${companyId}`),
    getCall: (callSid: string) =>
      request<LiveCall>(`/api/live/call/${callSid}`),
    intervene: (callSid: string) =>
      request<{ message: string; call_sid: string; status: string }>(
        `/api/live/intervene/${callSid}`, { method: 'POST', body: {} }
      ),
  },

  // ── Analytics ───────────────────────────────────────
  analytics: {
    getWeekly: (companyId: string) =>
      request<{ success: boolean; data: WeeklyStats }>(`/api/analytics/weekly/${companyId}`),
    getComparison: (companyId: string) =>
      request<{ success: boolean; data: { this_week: WeeklyStats; last_week: WeeklyStats; changes: Record<string, number> } }>(
        `/api/analytics/weekly/${companyId}/compare`
      ),
    getTrends: (companyId: string, days = 14) =>
      request<{ success: boolean; data: DailyTrend[]; days: number }>(
        `/api/analytics/trends/${companyId}?days=${days}`
      ),
    getHeatmap: (companyId: string) =>
      request<{ success: boolean; data: Record<string, unknown> }>(`/api/analytics/heatmap/${companyId}`),
    getCampaignStats: (companyId: string) =>
      request<{ success: boolean; data: Record<string, unknown> }>(`/api/analytics/campaigns/${companyId}`),
  },

  // ── Appointments ────────────────────────────────────
  appointments: {
    list: (companyId: string, dateFrom?: string, dateTo?: string) => {
      let ep = `/api/appointments/${companyId}`
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const qs = params.toString()
      if (qs) ep += `?${qs}`
      return request<{ success: boolean; appointments: Appointment[]; count: number }>(ep)
    },
    updateStatus: (appointmentId: string, status: string) =>
      request<{ success: boolean; appointment_id: string; status: string }>(
        `/api/appointments/${appointmentId}/status?status=${status}`, { method: 'PUT' }
      ),
    create: (data: {
      company_id: string
      customer_name: string
      customer_phone: string
      appointment_date: string
      appointment_time: string
      notes?: string
    }) => request<{ success: boolean; appointment: Appointment }>(
      '/api/appointments/create', { method: 'POST', body: data }
    ),
  },
}
