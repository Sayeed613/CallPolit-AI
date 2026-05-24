import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, List, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import { SkeletonCard } from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import { appointmentsApi } from '../lib/api'
import { formatDate, formatTime, maskPhone } from '../lib/utils'
import useCompanyStore from '../stores/companyStore'

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'brand' | 'default'> = {
  scheduled: 'brand',
  confirmed: 'success',
  completed: 'default',
  cancelled: 'error',
  'no-show': 'warning',
}

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AppointmentsTab() {
  const { company } = useCompanyStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())

  useEffect(() => {
    if (!company?.id) return
    loadAppointments()
  }, [company?.id])

  const loadAppointments = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      const data = await appointmentsApi.list(company.id)
      setAppointments(data.appointments || [])
    } catch {
      // fallback
    }
    setLoading(false)
  }

  const filtered = statusFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === statusFilter)

  const allStatusTabs = statusTabs.map((tab) => ({
    ...tab,
    count: tab.value === 'all' ? appointments.length : appointments.filter((a) => a.status === tab.value).length,
  }))

  // Calendar helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })

  const getAppointmentsForDate = (date: string) =>
    appointments.filter((a) => a.appointment_date === date)

  // Day appointments panel
  const dayAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Appointments</h2>
          <p className="text-sm text-text-tertiary">{appointments.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-bg-surface rounded-lg border border-border-default">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-bg-elevated text-text-primary' : 'text-text-tertiary'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`p-1.5 rounded transition-colors ${view === 'calendar' ? 'bg-bg-elevated text-text-primary' : 'text-text-tertiary'}`}
            >
              <Calendar size={16} />
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>
            New Appointment
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <Tabs tabs={allStatusTabs} activeTab={statusFilter} onChange={setStatusFilter} />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Calendar size={40} className="text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((apt) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-bg-card border border-border-subtle hover:border-border-default transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center flex-shrink-0">
                      <p className="text-lg font-bold text-text-primary">
                        {new Date(apt.appointment_date).getDate()}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {apt.contact_name || maskPhone(apt.contact_phone) || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                        <span>{apt.appointment_time?.slice(0, 5)}</span>
                        <span>·</span>
                        <span>{apt.duration_minutes} min</span>
                        <span>·</span>
                        <span>{apt.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={statusBadgeVariant[apt.status] || 'default'} size="sm">
                      {apt.status}
                    </Badge>
                    <span className="text-xs text-text-tertiary">by {apt.booked_by}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Calendar View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11)
                      setCurrentYear(currentYear - 1)
                    } else {
                      setCurrentMonth(currentMonth - 1)
                    }
                  }}
                  className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md hover:bg-bg-elevated"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className="text-base font-semibold text-text-primary">{monthName} {currentYear}</h3>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0)
                      setCurrentYear(currentYear + 1)
                    } else {
                      setCurrentMonth(currentMonth + 1)
                    }
                  }}
                  className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md hover:bg-bg-elevated"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs text-text-tertiary py-1">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 rounded-lg" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                  const dayApts = getAppointmentsForDate(date)
                  const isToday = date === now.toISOString().split('T')[0]
                  const isSelected = date === selectedDate

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`h-20 rounded-lg border p-1 text-left transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10'
                          : isToday
                            ? 'border-brand-500/30 bg-brand-500/5'
                            : 'border-border-subtle hover:border-border-default bg-bg-surface'
                      }`}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-brand-400' : 'text-text-tertiary'}`}>
                        {i + 1}
                      </span>
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayApts.slice(0, 3).map((apt) => (
                          <div
                            key={apt.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                apt.status === 'scheduled' ? '#6366f1' :
                                apt.status === 'confirmed' ? '#22c55e' :
                                apt.status === 'completed' ? '#a1a1a1' :
                                apt.status === 'cancelled' ? '#ef4444' : '#f59e0b',
                            }}
                          />
                        ))}
                        {dayApts.length > 3 && (
                          <span className="text-[9px] text-text-tertiary">+{dayApts.length - 3}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Day details panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{selectedDate ? formatDate(selectedDate) : 'Select a date'}</CardTitle>
                {selectedDate && (
                  <button onClick={() => setSelectedDate(null)} className="text-text-tertiary hover:text-text-primary">
                    <X size={16} />
                  </button>
                )}
              </CardHeader>
              {dayAppointments.length === 0 ? (
                <p className="text-sm text-text-tertiary text-center py-8">
                  {selectedDate ? 'No appointments' : 'Click a date to view appointments'}
                </p>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((apt) => (
                    <div key={apt.id} className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-text-primary">{apt.contact_name || 'Unknown'}</p>
                        <Badge variant={statusBadgeVariant[apt.status] || 'default'} size="sm">{apt.status}</Badge>
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {apt.appointment_time?.slice(0, 5)} · {apt.duration_minutes} min · {apt.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Appointment" maxWidth="sm">
        <form className="space-y-4">
          <input type="text" placeholder="Customer name" className="w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-sm" />
          <input type="text" placeholder="Phone" className="w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-sm" />
          <input type="date" className="w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-sm" />
          <input type="time" className="w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-sm" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AppointmentsTab
