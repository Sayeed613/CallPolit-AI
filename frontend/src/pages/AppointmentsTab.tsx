import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { PageWrapper } from '../components/layout/PageWrapper'
import { api } from '../lib/api'
import { useCompanyStore } from '../stores/companyStore'

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'no-show', label: 'No Show' },
]

const statusColors: Record<string, 'brand' | 'success' | 'warning' | 'error' | 'default'> = {
  scheduled: 'brand',
  confirmed: 'success',
  completed: 'default',
  cancelled: 'error',
  'no-show': 'warning',
}

export function AppointmentsTab() {
  const { activeCompany } = useCompanyStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const cid = activeCompany?.id || ''
        const data = await api.appointments.list(cid)
        setAppointments(data.appointments || [])
      } catch {
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCompany?.id])

  const filtered = appointments.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false
    return true
  })

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.appointments.updateStatus(id, status)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      )
    } catch {
      // handle error
    }
  }

  return (
    <PageWrapper
      title="Appointments"
      subtitle="Manage customer appointments"
      actions={
        <div className="flex gap-2">
          <Select
            options={[
              { value: 'all', label: 'All Dates' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
            ]}
            value={dateFilter}
            onChange={setDateFilter}
            className="w-36"
          />
        </div>
      }
    >
      <Tabs
        tabs={statusFilters.map((t) => ({
          ...t,
          badge: t.id === 'all' ? appointments.length : appointments.filter((a) => a.status === t.id).length,
        }))}
        activeTab={filter}
        onChange={setFilter}
        className="mb-6"
      />

      {loading ? (
        <Card className="p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-surface-border/50 py-3 last:border-0">
              <div>
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center py-16">
          <span className="mb-4 text-5xl">📅</span>
          <h3 className="mb-2 text-lg font-medium text-text-primary">No appointments</h3>
          <p className="text-sm text-text-muted">Appointments booked by AI will appear here</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="p-3 font-medium text-text-muted">Customer</th>
                  <th className="p-3 font-medium text-text-muted">Phone</th>
                  <th className="p-3 font-medium text-text-muted">Date & Time</th>
                  <th className="p-3 font-medium text-text-muted">Status</th>
                  <th className="p-3 font-medium text-text-muted">Booked By</th>
                  <th className="p-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt, i) => (
                  <motion.tr
                    key={appt.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-surface-border/50 transition-colors hover:bg-surface-hover"
                  >
                    <td className="p-3 font-medium text-text-primary">{appt.customer_name || '-'}</td>
                    <td className="p-3 text-text-secondary">
                      {appt.customer_phone?.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}
                    </td>
                    <td className="p-3 text-text-secondary">
                      {appt.appointment_date
                        ? new Date(appt.appointment_date).toLocaleDateString()
                        : '-'}{' '}
                      {appt.appointment_time || ''}
                    </td>
                    <td className="p-3">
                      <Badge variant={statusColors[appt.status] || 'default'} size="sm">
                        {appt.status || 'scheduled'}
                      </Badge>
                    </td>
                    <td className="p-3 text-text-secondary">{appt.booked_by || 'AI'}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {appt.status === 'scheduled' && (
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(appt.id, 'confirmed')}>
                            Confirm
                          </Button>
                        )}
                        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(appt.id, 'cancelled')}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageWrapper>
  )
}
