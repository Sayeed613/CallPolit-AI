import { useEffect, useState } from 'react'
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
      const res = await fetch('/api/company/list', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.companies) setCompanies(data.companies)
      } else {
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
