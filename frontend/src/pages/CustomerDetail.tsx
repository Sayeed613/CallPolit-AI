import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Star, Calendar, Shield, Edit3 } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { SkeletonCard } from '../components/ui/Skeleton'
import { customersApi } from '../lib/api'
import { formatDateTime, maskPhone, maskEmail, formatDuration } from '../lib/utils'
import { useToast } from '../components/ui/Toast'

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', notes: '' })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await customersApi.get(id)
        setCustomer(data)
        setEditForm({ name: data.name || '', email: data.email || '', notes: data.notes || '' })
      } catch {
        // fallback
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    if (!id) return
    try {
      await customersApi.update(id, editForm)
      setCustomer((prev: any) => ({ ...prev, ...editForm }))
      setEditing(false)
      addToast({ type: 'success', message: 'Customer updated' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Customer not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/customers')}>
          Back to customers
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to customers
      </button>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{customer.name?.[0] || '?'}</span>
            </div>
            <div>
              {editing ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="mb-1"
                />
              ) : (
                <h1 className="text-lg font-bold text-text-primary">{customer.name || 'Unknown'}</h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={customer.status === 'active' ? 'success' : 'default'} size="sm">{customer.status}</Badge>
                {customer.is_vip && <Badge variant="warning" size="sm">VIP</Badge>}
                <Badge variant={customer.verified ? 'success' : 'default'} size="sm" dot={customer.verified}>
                  {customer.verified ? `Verified L${customer.verification_level}` : 'Unverified'}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} icon={<Edit3 size={14} />}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface">
            <Phone size={16} className="text-text-tertiary" />
            <div>
              <p className="text-xs text-text-tertiary">Phone</p>
              <p className="text-sm text-text-primary font-mono">{maskPhone(customer.phone)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface">
            <Mail size={16} className="text-text-tertiary" />
            <div>
              <p className="text-xs text-text-tertiary">Email</p>
              {editing ? (
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-text-primary">{customer.email || '-'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface">
            <Calendar size={16} className="text-text-tertiary" />
            <div>
              <p className="text-xs text-text-tertiary">Last Called</p>
              <p className="text-sm text-text-primary">{customer.last_called ? formatDateTime(customer.last_called) : 'Never'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface">
            <Shield size={16} className="text-text-tertiary" />
            <div>
              <p className="text-xs text-text-tertiary">Verification Level</p>
              <p className="text-sm text-text-primary">{customer.verification_level || 0}</p>
            </div>
          </div>
        </div>

        {editing && (
          <div className="mt-4">
            <label className="block text-sm text-text-secondary mb-1">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full bg-bg-surface border border-border-default rounded-lg p-3 text-sm text-text-primary outline-none focus:border-brand-500/50 transition-colors resize-none h-24"
            />
            <div className="flex justify-end mt-3">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Call history */}
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <p className="text-sm text-text-tertiary text-center py-8">No call history available</p>
      </Card>
    </div>
  )
}

export default CustomerDetail
