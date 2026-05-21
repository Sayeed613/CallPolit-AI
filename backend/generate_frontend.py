#!/usr/bin/env python3
"""Generate all frontend source files for CallPilot AI."""
import os

BASE = "../frontend/src"

def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Created: {path}")

print("Generating frontend source files...")

# ─── Config / Entry ──────────────────────────────────────

write("vite-env.d.ts", '/// <reference types="vite/client" />\n')

write("index.css", '''@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-150;
  }
  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }
}
''')

write("main.tsx", '''import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
''')

# ─── Supabase Client ─────────────────────────────────────

write("lib/supabase.ts", '''import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  await supabase.auth.signOut()
}
''')

# ─── API Client ──────────────────────────────────────────

write("lib/api.ts", '''const API_BASE = ''

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  isFormData?: boolean
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('./supabase')
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
''')

# ─── App (Routes) ────────────────────────────────────────

write("App.tsx", '''import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CompanyPage from './pages/CompanyPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const sub = supabase.auth.onAuthStateChange((_event, session) => setAuthed(!!session))
    return () => sub.data.subscription.unsubscribe()
  }, [])
  if (authed === null) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/company/:id" element={<ProtectedRoute><Layout><CompanyPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
''')

# ─── Components ──────────────────────────────────────────

write("components/Layout.tsx", '''import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Building2, LogOut, Menu, X, Phone, BarChart3
} from 'lucide-react'

interface Company {
  id: string
  name: string
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''))
    // Fetch companies from the user
    const fetchCompanies = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/company/get/placeholder', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      // Just use the ID from URL for now
    }
    fetchCompanies()
  }, [])

  // Extract company ID from URL if on a company page
  const companyMatch = location.pathname.match(/\/company\/([^/]+)/)
  const activeCompanyId = companyMatch?.[1] || null

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]

  if (activeCompanyId) {
    navItems.push(
      { path: `/company/${activeCompanyId}`, icon: Building2, label: 'Overview' },
      { path: `/company/${activeCompanyId}?tab=analytics`, icon: BarChart3, label: 'Analytics' },
      { path: `/company/${activeCompanyId}?tab=campaigns`, icon: Phone, label: 'Campaigns' },
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CallPilot</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2 truncate">{userEmail}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="p-1"><Menu className="w-6 h-6" /></button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">CallPilot</span>
          </Link>
          <div className="w-8" />
        </div>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
''')

# ─── Login Page ──────────────────────────────────────────

write("pages/Login.tsx", '''import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Phone, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Invalid email or password'
        : authError.message
      )
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CallPilot AI</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
''')

# ─── Dashboard Page ──────────────────────────────────────

write("pages/Dashboard.tsx", '''import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Building2, Plus, TrendingUp, Clock, Phone, Calendar
} from 'lucide-react'

interface Company {
  id: string
  name: string
  industry: string
  mode: string
  created_at: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIndustry, setNewIndustry] = useState('Healthcare')
  const [newMode, setNewMode] = useState('both')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/company/get/all-companies', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      // Fallback - list all companies via raw table query
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (supabaseUrl && anonKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(supabaseUrl, anonKey)
        const { data } = await sb
          .from('companies')
          .select('id, name, industry, mode, created_at')
          .order('created_at', { ascending: false })
        if (data) setCompanies(data as Company[])
      }
    } catch (e) {
      console.error('Failed to load companies', e)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/company/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: newName, industry: newIndustry, mode: newMode, plan: newMode }),
      })
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      setShowCreate(false)
      setNewName('')
      navigate(`/company/${result.company_id}`)
    } catch (e) {
      console.error(e)
    }
    setCreating(false)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your companies and campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Company
        </button>
      </div>

      {/* Create Company Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create New Company</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} className="input-field" required placeholder="My Business" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select value={newIndustry} onChange={e => setNewIndustry(e.target.value)} className="input-field">
                  <option>Healthcare</option>
                  <option>Real Estate</option>
                  <option>Education</option>
                  <option>Finance</option>
                  <option>E-commerce</option>
                  <option>Services</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select value={newMode} onChange={e => setNewMode(e.target.value)} className="input-field">
                  <option value="both">Both (Inbound + Outbound)</option>
                  <option value="outbound">Outbound Only</option>
                  <option value="inbound">Inbound Only</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company List */}
      {companies.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No companies yet</h3>
          <p className="text-gray-400 mb-4">Create your first company to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Company</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map(c => (
            <Link key={c.id} to={`/company/${c.id}`} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{c.mode}</span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{c.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{c.industry}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                <Clock className="w-3 h-3" />
                {new Date(c.created_at).toLocaleDateString('en-IN')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
''')

# ─── Company Page (with Tabs) ────────────────────────────

write("pages/CompanyPage.tsx", '''import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getCompany, type Company } from '../lib/api'
import { Building2, Settings } from 'lucide-react'
import DocumentsTab from './DocumentsTab'
import ContactsTab from './ContactsTab'
import CampaignsTab from './CampaignsTab'
import AnalyticsTab from './AnalyticsTab'
import AppointmentsTab from './AppointmentsTab'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'appointments', label: 'Appointments' },
]

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'overview'
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getCompany(id).then(c => {
      setCompany(c)
      setLoading(false)
    }).catch(e => {
      setError(e.message)
      setLoading(false)
    })
  }, [id])

  function setTab(key: string) {
    setSearchParams(key === 'overview' ? {} : { tab: key })
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  }

  if (error || !company) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600">{error || 'Company not found'}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              {company.industry}
              <span className="text-gray-300">|</span>
              <span className="capitalize">{company.mode} mode</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && <OverviewTab company={company} />}
      {tab === 'documents' && <DocumentsTab companyId={id!} />}
      {tab === 'contacts' && <ContactsTab companyId={id!} />}
      {tab === 'campaigns' && <CampaignsTab companyId={id!} />}
      {tab === 'analytics' && <AnalyticsTab companyId={id!} />}
      {tab === 'appointments' && <AppointmentsTab companyId={id!} />}
    </div>
  )
}

function OverviewTab({ company }: { company: Company }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Company Details</h3>
        <dl className="space-y-3">
          {[
            ['Name', company.name],
            ['Industry', company.industry],
            ['Mode', company.mode],
            ['Plan', company.plan],
            ['Phone', company.twilio_phone || 'Not assigned'],
            ['Created', new Date(company.created_at).toLocaleDateString('en-IN')],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-sm text-gray-500">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button onClick={() => document.querySelector('[data-tab="documents"]')?.click()}
            className="btn-primary w-full text-left justify-start flex items-center gap-2">
            Upload Documents
          </button>
          <button onClick={() => document.querySelector('[data-tab="contacts"]')?.click()}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-green-600 hover:bg-green-700">
            Upload Contacts
          </button>
          <button onClick={() => document.querySelector('[data-tab="campaigns"]')?.click()}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            Launch Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
''')

# ─── Documents Tab ───────────────────────────────────────

write("pages/DocumentsTab.tsx", '''import { useState, useRef } from 'react'
import { uploadDocument, queryDocuments } from '../lib/api'
import { Upload, FileText, Search, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function DocumentsTab({ companyId }: { companyId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [querying, setQuerying] = useState(false)
  const [queryResults, setQueryResults] = useState<{ chunk_text: string; similarity: number }[] | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    setUploadError(null)
    try {
      const result = await uploadDocument(companyId, file)
      setUploadResult(`Uploaded "${file.name}" — ${result.chunks_created} chunks created`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setQuerying(true)
    try {
      const result = await queryDocuments(companyId, query)
      setQueryResults(result.chunks)
    } catch (err: unknown) {
      console.error(err)
    }
    setQuerying(false)
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" /> Upload PDF
        </h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={() => setUploadResult(null)}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-primary-600 hover:text-primary-700 font-medium">
              Click to select a PDF
            </button>
            <p className="text-sm text-gray-400 mt-1">PDF files only</p>
          </div>
          <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {uploadResult && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" /> {uploadResult}
          </div>
        )}
        {uploadError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <XCircle className="w-4 h-4" /> {uploadError}
          </div>
        )}
      </div>

      {/* Test Query */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary-600" /> Test Document Search
        </h3>
        <form onSubmit={handleQuery} className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field flex-1"
            placeholder="Ask a question about your documents..."
          />
          <button type="submit" disabled={querying} className="btn-primary flex items-center gap-2">
            {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </form>
        {queryResults && (
          <div className="mt-4 space-y-3">
            {queryResults.length === 0 ? (
              <p className="text-sm text-gray-400">No matching content found</p>
            ) : (
              queryResults.map((chunk, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Relevance: {(chunk.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-gray-700">{chunk.chunk_text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
''')

# ─── Contacts Tab ────────────────────────────────────────

write("pages/ContactsTab.tsx", '''import { useState, useRef } from 'react'
import { uploadContacts } from '../lib/api'
import { Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ContactsTab({ companyId }: { companyId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setResult(null)
    setError(null)
    try {
      const res = await uploadContacts(companyId, file)
      setResult({ imported: res.imported, skipped: res.skipped })
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" /> Upload Contacts
        </h3>
        <a
          href="data:text/csv;charset=utf-8,phone%2Cname%2Cemail%0A9876543210%2CRahul+Sharma%2Crahul%40example.com%0A"
          download="sample_contacts.csv"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Sample CSV
        </a>
      </div>
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={() => setResult(null)} />
          <button type="button" onClick={() => fileRef.current?.click()} className="text-primary-600 hover:text-primary-700 font-medium">
            Click to select CSV or Excel
          </button>
          <p className="text-sm text-gray-400 mt-1">CSV or Excel format</p>
        </div>
        <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Upload Contacts'}
        </button>
      </form>
      {result && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          Imported {result.imported} contacts{result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}
        </div>
      )}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
          <XCircle className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  )
}
''')

# ─── Campaigns Tab ───────────────────────────────────────

write("pages/CampaignsTab.tsx", '''import { useState, useEffect } from 'react'
import { launchCampaign, getCompany } from '../lib/api'
import { Play, Loader2, Phone, CheckCircle, XCircle, Activity } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: string
  total_contacts: number
  called: number
  connected: number
  launched_at: string
}

export default function CampaignsTab({ companyId }: { companyId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showLaunch, setShowLaunch] = useState(false)
  const [name, setName] = useState('')
  const [cpm, setCpm] = useState(2)
  const [launching, setLaunching] = useState(false)

  // Since there's no GET campaigns endpoint yet, we'll try to load from company data
  useEffect(() => {
    loadCampaigns()
    const interval = setInterval(loadCampaigns, 10000)
    return () => clearInterval(interval)
  }, [companyId])

  async function loadCampaigns() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (supabaseUrl && anonKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(supabaseUrl, anonKey)
        const { data: { session } } = await sb.auth.getSession()
        if (!session) return
        
        const { createClient: createServerClient } = await import('@supabase/supabase-js')
        const sbs = createServerClient(supabaseUrl, anonKey)
        const { data } = await sbs
          .from('campaigns')
          .select('*')
          .eq('company_id', companyId)
          .order('launched_at', { ascending: false })
        if (data) setCampaigns(data as Campaign[])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    setLaunching(true)
    try {
      await launchCampaign(companyId, name, cpm)
      setShowLaunch(false)
      setName('')
      await loadCampaigns()
    } catch (err) {
      console.error(err)
    }
    setLaunching(false)
  }

  const progress = (c: Campaign) =>
    c.total_contacts > 0 ? Math.round(((c.called || 0) / c.total_contacts) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary-600" /> Campaigns
        </h3>
        <button onClick={() => setShowLaunch(true)} className="btn-primary flex items-center gap-2 text-sm py-1.5 px-3">
          <Play className="w-4 h-4" /> Launch Campaign
        </button>
      </div>

      {/* Launch Modal */}
      {showLaunch && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowLaunch(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Launch Campaign</h2>
            <form onSubmit={handleLaunch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input-field" required placeholder="June Follow-up" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calls per Minute</label>
                <input type="number" value={cpm} onChange={e => setCpm(Number(e.target.value))} className="input-field" min={1} max={10} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowLaunch(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={launching} className="btn-primary">
                  {launching ? 'Launching...' : 'Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-8">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No campaigns yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{c.name}</h4>
                  <p className="text-xs text-gray-400">
                    {c.launched_at ? new Date(c.launched_at).toLocaleString('en-IN') : 'Draft'}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                  c.status === 'completed' ? 'bg-green-100 text-green-700' :
                  c.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {c.status}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress(c)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{c.called || 0}/{c.total_contacts}</div>
                  <div className="text-xs text-gray-500">Called</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">{c.connected || 0}</div>
                  <div className="text-xs text-gray-500">Connected</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-primary-600">{progress(c)}%</div>
                  <div className="text-xs text-gray-500">Progress</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
''')

# ─── Analytics Tab ───────────────────────────────────────

write("pages/AnalyticsTab.tsx", '''import { useEffect, useState } from 'react'
import { getWeeklyAnalytics, getWeeklyComparison, getDailyTrends, type WeeklyStats, type DailyTrend } from '../lib/api'
import { TrendingUp, TrendingDown, Phone, Calendar, Clock, Users, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts'

export default function AnalyticsTab({ companyId }: { companyId: string }) {
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null)
  const [comparison, setComparison] = useState<{ this_week: WeeklyStats; last_week: WeeklyStats; changes: Record<string, number> } | null>(null)
  const [trends, setTrends] = useState<DailyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(14)

  useEffect(() => {
    Promise.all([
      getWeeklyAnalytics(companyId).then(r => setWeekly(r.data)).catch(() => {}),
      getWeeklyComparison(companyId).then(r => setComparison(r.data)).catch(() => {}),
      getDailyTrends(companyId, days).then(r => setTrends(r.data)).catch(() => {}),
    ]).then(() => setLoading(false))
  }, [companyId, days])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  }

  const statCards = weekly ? [
    { label: 'Total Calls', value: weekly.calls_total, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Connected', value: weekly.calls_connected, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Appointments', value: weekly.appointments_booked, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Avg Duration', value: `${Math.round(weekly.avg_duration_seconds / 60)}m`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Connect Rate', value: `${weekly.connect_rate_pct}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: 'Hours Saved', value: weekly.hours_saved, icon: BarChart3, color: 'text-primary-600', bg: 'bg-primary-100' },
  ] : []

  function changeBadge(key: string) {
    if (!comparison) return null
    const val = comparison.changes[key]
    if (val === undefined || val === null) return null
    const isPositive = val >= 0
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(val).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="card text-center">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison */}
      {comparison && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">This Week vs Last Week</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">Metric</th>
                  <th className="text-right py-2 font-medium text-gray-500">This Week</th>
                  <th className="text-right py-2 font-medium text-gray-500">Last Week</th>
                  <th className="text-right py-2 font-medium text-gray-500">Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'calls_total', label: 'Total Calls' },
                  { key: 'calls_connected', label: 'Connected' },
                  { key: 'appointments_booked', label: 'Appointments' },
                  { key: 'hours_saved', label: 'Hours Saved' },
                  { key: 'connect_rate_pct', label: 'Connect Rate' },
                ].map(({ key, label }) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{label}</td>
                    <td className="text-right py-2 font-medium">
                      {comparison.this_week[key as keyof WeeklyStats]}
                      {key === 'connect_rate_pct' ? '%' : ''}
                    </td>
                    <td className="text-right py-2 text-gray-500">
                      {comparison.last_week[key as keyof WeeklyStats]}
                      {key === 'connect_rate_pct' ? '%' : ''}
                    </td>
                    <td className="text-right py-2">{changeBadge(key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Trends Chart */}
      {trends.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Daily Trends</h3>
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="text-sm border border-gray-300 rounded-lg px-2 py-1">
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" stroke="#3b82f6" name="Calls" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="connected" stroke="#22c55e" name="Connected" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="appointments" stroke="#a855f7" name="Appointments" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
''')

# ─── Appointments Tab ────────────────────────────────────

write("pages/AppointmentsTab.tsx", '''import { useEffect, useState } from 'react'
import { listAppointments, updateAppointmentStatus, type Appointment } from '../lib/api'
import { Calendar, Clock, Phone, User, Loader2, CheckCircle, XCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

export default function AppointmentsTab({ companyId }: { companyId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [companyId])

  async function loadAppointments() {
    setLoading(true)
    try {
      const result = await listAppointments(companyId, dateFrom || undefined, dateTo || undefined)
      setAppointments(result.appointments)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleStatus(id: string, status: string) {
    try {
      await updateAppointmentStatus(id, status)
      await loadAppointments()
    } catch (e) {
      console.error(e)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm py-1.5" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm py-1.5" />
          </div>
          <button onClick={loadAppointments} className="btn-primary text-sm py-1.5">
            Filter
          </button>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn-secondary text-sm py-1.5">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-8">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => (
            <div key={a.id} className="card flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{a.customer_name}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(a.appointment_date + 'T' + a.appointment_time).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {a.appointment_time}
                    </span>
                    {a.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {a.customer_phone}
                      </span>
                    )}
                  </div>
                  {a.notes && <p className="text-sm text-gray-400 mt-1">{a.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                  {a.status}
                </span>
                {a.status === 'scheduled' || a.status === 'confirmed' ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStatus(a.id, 'completed')}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                      title="Mark completed"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatus(a.id, 'cancelled')}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
''')

print("\\nAll frontend source files generated successfully!")
print(f"Location: {os.path.abspath(BASE)}")
