import { useEffect, useState } from 'react'
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
