import { useState, useEffect } from 'react'
import { launchCampaign, getCompany } from '../lib/api'
import { supabase } from '../lib/supabase'
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('launched_at', { ascending: false })
      if (data) setCampaigns(data as Campaign[])
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
