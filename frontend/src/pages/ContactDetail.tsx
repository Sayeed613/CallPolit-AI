import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { PageWrapper } from '../components/layout/PageWrapper'
import { api } from '../lib/api'

export function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contact, setContact] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        const data = await api.contacts.get(id)
        setContact(data)
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <PageWrapper title="">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </PageWrapper>
    )
  }

  if (!contact) {
    return (
      <PageWrapper title="Contact not found">
        <Button variant="secondary" onClick={() => navigate('/contacts')}>
          ← Back to Contacts
        </Button>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={contact.name || 'Contact Details'}
      subtitle={contact.phone?.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}
      actions={
        <Button variant="secondary" onClick={() => navigate('/contacts')}>
          ← Back
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card className="p-6">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 text-3xl">
            {contact.name?.[0] || '?'}
          </div>
          <h2 className="mb-1 text-xl font-bold text-text-primary">{contact.name || 'Unknown'}</h2>
          <div className="mb-4 flex items-center gap-2">
            {contact.is_vip && <Badge variant="brand">VIP</Badge>}
            <Badge variant={contact.status === 'connected' ? 'success' : 'default'}>
              {contact.status || 'pending'}
            </Badge>
          </div>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>📞 {contact.phone || '-'}</p>
            <p>✉ {contact.email || '-'}</p>
            <p>📅 KYC: {contact.kyc_status || 'pending'}</p>
            <p>⚠ Risk Score: {contact.risk_score || 0}</p>
          </div>
        </Card>

        {/* Details */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Contact Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-surface-secondary p-3">
                <p className="text-xs text-text-muted">Account Number</p>
                <p className="font-medium text-text-primary">{contact.account_number || '-'}</p>
              </div>
              <div className="rounded-lg bg-surface-secondary p-3">
                <p className="text-xs text-text-muted">Policy Number</p>
                <p className="font-medium text-text-primary">{contact.policy_number || '-'}</p>
              </div>
              <div className="rounded-lg bg-surface-secondary p-3">
                <p className="text-xs text-text-muted">Date of Birth</p>
                <p className="font-medium text-text-primary">{contact.date_of_birth || '-'}</p>
              </div>
              <div className="rounded-lg bg-surface-secondary p-3">
                <p className="text-xs text-text-muted">Customer ID</p>
                <p className="font-medium text-text-primary">{contact.customer_id || '-'}</p>
              </div>
            </div>
          </div>

          <h3 className="mb-4 mt-6 text-lg font-semibold text-text-primary">Outstanding Dues</h3>
          <div className="rounded-lg bg-yellow-500/10 p-4">
            <p className="text-2xl font-bold text-yellow-400">
              ₹{contact.outstanding_dues?.toLocaleString() || '0'}
            </p>
          </div>

          {contact.open_tickets?.length > 0 && (
            <>
              <h3 className="mb-4 mt-6 text-lg font-semibold text-text-primary">Open Tickets</h3>
              <div className="space-y-2">
                {contact.open_tickets.map((ticket: any, i: number) => (
                  <div key={i} className="rounded-lg bg-surface-secondary p-3">
                    <p className="text-sm text-text-primary">{ticket.subject || `Ticket #${i + 1}`}</p>
                    <p className="text-xs text-text-muted">{ticket.status || 'open'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}
