import { useEffect, useState } from 'react'
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
      {tab === 'overview' && <OverviewTab company={company} setTab={setTab} />}
      {tab === 'documents' && <DocumentsTab companyId={id!} />}
      {tab === 'contacts' && <ContactsTab companyId={id!} />}
      {tab === 'campaigns' && <CampaignsTab companyId={id!} />}
      {tab === 'analytics' && <AnalyticsTab companyId={id!} />}
      {tab === 'appointments' && <AppointmentsTab companyId={id!} />}
    </div>
  )
}

function OverviewTab({ company, setTab }: { company: Company; setTab: (key: string) => void }) {
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
          <button onClick={() => setTab('documents')}
            className="btn-primary w-full text-left justify-start flex items-center gap-2">
            Upload Documents
          </button>
          <button onClick={() => setTab('contacts')}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-green-600 hover:bg-green-700">
            Upload Contacts
          </button>
          <button onClick={() => setTab('campaigns')}
            className="btn-primary w-full text-left justify-start flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            Launch Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
