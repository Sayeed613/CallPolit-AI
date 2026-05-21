import { supabase } from './supabase'
import { supabase as supabaseClient } from './supabase'
const API_BASE = ''


interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  isFormData?: boolean
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...options.headers }
  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  const authHeaders = await getAuthHeaders()
  Object.assign(headers, authHeaders)

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  }
  if (options.body && !options.isFormData) {
    config.body = JSON.stringify(options.body)
  } else if (options.body && options.isFormData) {
    config.body = options.body as FormData
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config)
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try { const err = await res.json(); detail = err.detail || detail } catch {}
    throw new Error(detail)
  }
  return res.json()
}

// ─── Company ────────────────────────────────────────────

export interface Company {
  id: string
  user_id: string
  name: string
  industry: string
  mode: string
  plan: string
  twilio_phone: string
  created_at: string
}

export async function createCompany(data: { name: string; industry: string; mode: string; plan: string }) {
  return request<{ success: boolean; company_id: string; name: string; mode: string }>('/api/company/create', {
    method: 'POST', body: data,
  })
}

export async function getCompany(id: string) {
  return request<Company>(`/api/company/get/${id}`)
}

// ─── Documents ──────────────────────────────────────────

export async function uploadDocument(companyId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('company_id', companyId)
  return request<{ success: boolean; document_id: string; chunks_created: number; status: string }>(
    '/api/documents/upload', { method: 'POST', body: fd, isFormData: true }
  )
}

export async function queryDocuments(companyId: string, question: string) {
  return request<{ question: string; chunks: { chunk_text: string; similarity: number }[] }>(
    '/api/documents/query', { method: 'POST', body: { company_id: companyId, question } }
  )
}

// ─── Contacts ───────────────────────────────────────────

export async function uploadContacts(companyId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('company_id', companyId)
  return request<{ success: boolean; imported: number; skipped: number; total_rows: number }>(
    '/api/contacts/upload', { method: 'POST', body: fd, isFormData: true }
  )
}

// ─── Campaigns ──────────────────────────────────────────

export async function launchCampaign(companyId: string, name: string, callsPerMinute: number) {
  return request<{ success: boolean; campaign_id: string; total_contacts: number; status: string }>(
    '/api/campaign/launch', {
      method: 'POST',
      body: { company_id: companyId, campaign_name: name, calls_per_minute: callsPerMinute },
    }
  )
}

// ─── Appointments ───────────────────────────────────────

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

export async function listAppointments(companyId: string, dateFrom?: string, dateTo?: string) {
  let ep = `/api/appointments/${companyId}`
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  const qs = params.toString()
  if (qs) ep += `?${qs}`
  return request<{ success: boolean; appointments: Appointment[]; count: number }>(ep)
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  return request<{ success: boolean; appointment_id: string; status: string }>(
    `/api/appointments/${appointmentId}/status?status=${status}`, { method: 'PUT' }
  )
}

// ─── Analytics ──────────────────────────────────────────

export interface WeeklyStats {
  calls_total: number
  calls_connected: number
  appointments_booked: number
  avg_duration_seconds: number
  connect_rate_pct: number
  hours_saved: number
}

export async function getWeeklyAnalytics(companyId: string) {
  return request<{ success: boolean; data: WeeklyStats }>(`/api/analytics/weekly/${companyId}`)
}

export async function getWeeklyComparison(companyId: string) {
  return request<{ success: boolean; data: { this_week: WeeklyStats; last_week: WeeklyStats; changes: Record<string, number> } }>(
    `/api/analytics/weekly/${companyId}/compare`
  )
}

export interface DailyTrend {
  date: string
  calls: number
  connected: number
  avg_duration: number
  appointments: number
}

export async function getDailyTrends(companyId: string, days = 14) {
  return request<{ success: boolean; data: DailyTrend[]; days: number }>(
    `/api/analytics/trends/${companyId}?days=${days}`
  )
}
