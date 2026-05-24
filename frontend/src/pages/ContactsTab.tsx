import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useCompanyStore } from '../stores/companyStore'
import { api } from '../lib/api'

export function ContactsTab() {
  const navigate = useNavigate()
  const { activeCompany } = useCompanyStore()
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    async function load() {
      const cid = activeCompany?.id || ''
      if (!cid) { setLoading(false); return }
      try {
        const res = await api.contacts.list(cid)
        setContacts(res.contacts || [])
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCompany?.id])

  const filtered = contacts.filter((c) => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.phone?.includes(search)) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    return true
  })

  return (
    <PageWrapper
      title="Contacts"
      subtitle={`${contacts.length} contacts`}
      actions={
        <Button onClick={() => navigate('/contacts/import')} icon="plus">
          Import Contacts
        </Button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'connected', label: 'Connected' },
            { value: 'unreachable', label: 'Unreachable' },
            { value: 'invalid', label: 'Invalid' },
            { value: 'vip', label: 'VIP' },
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-40"
        />
      </div>

      {loading ? (
        <Card className="p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-surface-border/50 py-3 last:border-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center py-16">
          <span className="mb-4 text-5xl">👥</span>
          <h3 className="mb-2 text-lg font-medium text-text-primary">No contacts found</h3>
          <p className="mb-6 text-sm text-text-muted">
            {search ? 'Try a different search' : 'Import your first contact list to get started'}
          </p>
          {!search && (
            <Button onClick={() => navigate('/contacts/import')}>Import Contacts</Button>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="p-3 font-medium text-text-muted">Name</th>
                  <th className="p-3 font-medium text-text-muted">Phone</th>
                  <th className="p-3 font-medium text-text-muted">Email</th>
                  <th className="p-3 font-medium text-text-muted">Status</th>
                  <th className="p-3 font-medium text-text-muted">VIP</th>
                  <th className="p-3 font-medium text-text-muted">Last Contacted</th>
                  <th className="p-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact, i) => (
                  <motion.tr
                    key={contact.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-surface-border/50 transition-colors hover:bg-surface-hover"
                  >
                    <td className="p-3 font-medium text-text-primary">{contact.name || '-'}</td>
                    <td className="p-3 text-text-secondary">
                      {contact.phone?.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}
                    </td>
                    <td className="p-3 text-text-secondary">{contact.email || '-'}</td>
                    <td className="p-3">
                      <Badge variant={
                        contact.status === 'connected' ? 'success' :
                        contact.status === 'unreachable' ? 'warning' : 'default'
                      } size="sm">
                        {contact.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {contact.is_vip ? (
                        <Badge variant="brand" size="sm">VIP</Badge>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-text-secondary">
                      {contact.last_contacted
                        ? new Date(contact.last_contacted).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/contacts/${contact.id}`)}>
                        View
                      </Button>
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
