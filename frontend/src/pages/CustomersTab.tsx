import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Plus, Search, Upload, Filter, MoreHorizontal, Phone, Mail, Star, Trash2, Edit3 } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { SkeletonTable } from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import { customersApi } from '../lib/api'
import { formatDate, maskPhone, maskEmail, getTimeAgo } from '../lib/utils'
import useCompanyStore from '../stores/companyStore'
import { useToast } from '../components/ui/Toast'

export function CustomersTab() {
  const navigate = useNavigate()
  const { company } = useCompanyStore()
  const { addToast } = useToast()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editModal, setEditModal] = useState<any>(null)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)

  useEffect(() => {
    if (!company?.id) return
    loadCustomers()
  }, [company?.id])

  const loadCustomers = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      const data = await customersApi.list(company.id)
      setCustomers(data.customers || [])
    } catch {
      // fallback
    }
    setLoading(false)
  }

  const filtered = customers.filter((c) => {
    const matchesSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    try {
      await customersApi.delete(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      addToast({ type: 'success', message: 'Customer deleted' })
      setDeleteModal(null)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      await customersApi.update(id, data)
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
      addToast({ type: 'success', message: 'Customer updated' })
      setEditModal(null)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Customers</h2>
          <p className="text-sm text-text-tertiary">{customers.length} customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/customers/import')} icon={<Upload size={16} />}>
            Import
          </Button>
          <Button onClick={() => navigate('/customers/import')} icon={<Plus size={16} />}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-default rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-disabled outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'vip', label: 'VIP' },
          ]}
          className="w-40"
        />
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-5">
            <SkeletonTable rows={8} cols={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-text-tertiary">
                  <th className="text-left py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border-default accent-brand-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Last Called</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border-subtle hover:bg-bg-surface transition-colors cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                        className="rounded border-border-default accent-brand-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-brand-400">
                            {customer.name?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">{customer.name || 'Unknown'}</p>
                          {customer.is_vip && <Badge variant="warning" size="sm">VIP</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-mono text-xs">
                      {maskPhone(customer.phone)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs hidden md:table-cell">
                      {maskEmail(customer.email || '-')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        size="sm"
                        variant={customer.status === 'active' ? 'success' : customer.status === 'vip' ? 'warning' : 'default'}
                      >
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-tertiary text-xs hidden lg:table-cell">
                      {customer.last_called ? getTimeAgo(customer.last_called) : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditModal(customer)}
                          className="p-1.5 text-text-tertiary hover:text-text-primary rounded-md hover:bg-bg-elevated transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteModal(customer.id)}
                          className="p-1.5 text-text-tertiary hover:text-error rounded-md hover:bg-error/5 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-tertiary">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-bg-card border border-border-default rounded-xl shadow-elevated px-4 py-3 flex items-center gap-4">
          <span className="text-sm text-text-secondary">{selectedIds.size} selected</span>
          <Button variant="primary" size="sm">
            <Mail size={14} />
            Message
          </Button>
          <Button variant="danger" size="sm">
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Customer" maxWidth="sm">
        {editModal && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleUpdate(editModal.id, {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                status: formData.get('status') as string,
              })
            }}
            className="space-y-4"
          >
            <Input label="Name" name="name" defaultValue={editModal.name} />
            <Input label="Email" name="email" type="email" defaultValue={editModal.email} />
            <Select
              label="Status"
              name="status"
              defaultValue={editModal.status || 'active'}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'blocked', label: 'Blocked' },
                { value: 'vip', label: 'VIP' },
              ]}
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Customer" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete this customer? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CustomersTab
