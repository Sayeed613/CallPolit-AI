import { getErrorMessage, sleep } from './utils'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function getAuthHeaders(): Record<string, string> {
  // Supabase v2 stores session under sb-<project_ref>-auth-token keys
  // Try to find it by looking for any key starting with 'sb-'
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          const accessToken = parsed?.access_token
          if (accessToken) {
            return { Authorization: `Bearer ${accessToken}` }
          }
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return {}
}

type RequestOptions = RequestInit & {
  retries?: number
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { retries = 1, ...fetchOptions } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const isFormData = fetchOptions.body instanceof FormData

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...getAuthHeaders(),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (err: unknown) {
    clearTimeout(timeout)

    const error = err as Error
    const isNetworkError =
      error.name === 'AbortError' ||
      error.message === 'Failed to fetch' ||
      error.message.includes('NetworkError')

    if (retries > 0 && isNetworkError) {
      await sleep(1000)
      return request<T>(endpoint, { ...options, retries: retries - 1 })
    }

    throw error
  }
}

// Auth
export const authApi = {
  register: (email: string, password: string) =>
    request<{ user: any; session: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: any; session: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
}

// Company
export const companyApi = {
  get: () => request<any>('/company/get'),
  create: (name: string, industry?: string) =>
    request<any>('/company/create', {
      method: 'POST',
      body: JSON.stringify({ name, industry }),
    }),
  update: (companyId: string, data: Record<string, any>) =>
    request<any>(`/company/update/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (companyId: string) =>
    request<any>(`/company/delete/${companyId}`, { method: 'DELETE' }),
}

// Customers
export const customersApi = {
  list: (companyId: string) => request<{ customers: any[]; count: number }>(`/customers/list/${companyId}`),
  get: (customerId: string) => request<any>(`/customers/get/${customerId}`),
  update: (customerId: string, data: Record<string, any>) =>
    request<any>(`/customers/update/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (customerId: string) =>
    request<any>(`/customers/delete/${customerId}`, { method: 'DELETE' }),
  import: (companyId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<any>(`/customers/import/${companyId}`, {
      method: 'POST',
      body: formData,
      headers: {},
    })
  },
}

// Campaigns
export const campaignsApi = {
  list: (companyId: string) => request<{ campaigns: any[] }>(`/campaign/list/${companyId}`),
  get: (campaignId: string) => request<any>(`/campaign/get/${campaignId}`),
  create: (data: Record<string, any>) =>
    request<any>('/campaign/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  launch: (campaignId: string) =>
    request<any>(`/campaign/launch/${campaignId}`, { method: 'POST' }),
  pause: (campaignId: string) =>
    request<any>(`/campaign/${campaignId}/pause`, { method: 'POST' }),
  resume: (campaignId: string) =>
    request<any>(`/campaign/${campaignId}/resume`, { method: 'POST' }),
  forceComplete: (campaignId: string) =>
    request<any>(`/campaign/${campaignId}/force-complete`, { method: 'POST' }),
  callLogs: (campaignId: string) =>
    request<{ call_logs: any[] }>(`/campaign/call-logs/${campaignId}`),
  stats: (campaignId: string) => request<any>(`/campaign/stats/${campaignId}`),
}

// Documents
export const documentsApi = {
  list: (companyId: string) => request<{ documents: any[] }>(`/documents/list/${companyId}`),
  upload: (companyId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<any>(`/documents/upload/${companyId}`, {
      method: 'POST',
      body: formData,
      headers: {},
    })
  },
  delete: (documentId: string) =>
    request<any>(`/documents/delete/${documentId}`, { method: 'DELETE' }),
  query: (companyId: string, query: string) =>
    request<any>(`/documents/query/${companyId}`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
}

// Appointments
export const appointmentsApi = {
  list: (companyId: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ appointments: any[] }>(`/appointments/list/${companyId}${query}`)
  },
  create: (data: Record<string, any>) =>
    request<any>('/appointments/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (appointmentId: string, data: Record<string, any>) =>
    request<any>(`/appointments/update/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (appointmentId: string) =>
    request<any>(`/appointments/delete/${appointmentId}`, { method: 'DELETE' }),
  calendar: (companyId: string, year: number, month: number) =>
    request<any>(`/appointments/calendar/${companyId}/${year}/${month}`),
}

// Live
export const liveApi = {
  calls: () => request<{ calls: any[]; active_count: number }>('/live/calls'),
  stats: () => request<any>('/live/stats'),
}

// Verification
export const verificationApi = {
  sendOtp: (contactId: string, companyId: string) =>
    request<any>('/verification/send-otp', {
      method: 'POST',
      body: JSON.stringify({ contact_id: contactId, company_id: companyId }),
    }),
  verifyOtp: (contactId: string, companyId: string, otp: string) =>
    request<any>('/verification/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ contact_id: contactId, company_id: companyId, otp }),
    }),
  verify: (data: Record<string, any>) =>
    request<any>('/verification/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  test: () => request<any>('/verification/test', { method: 'POST' }),
}

// Analytics
export const analyticsApi = {
  stats: (companyId: string, days?: number) => {
    const query = days ? `?days=${days}` : ''
    return request<any>(`/analytics/stats/${companyId}${query}`)
  },
  activity: (companyId: string) => request<{ activities: any[] }>(`/analytics/activity/${companyId}`),
}

// Health
export const healthApi = {
  check: () => request<{ status: string }>('/health'),
}
