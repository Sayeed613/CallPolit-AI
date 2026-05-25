import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { companyApi } from '../lib/api'

export function CompanyPage() {


  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        const data = await companyApi.get()
        setCompany(data)
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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-border" />
        <div className="h-64 rounded-xl bg-border" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{company?.name || 'Company'}</h2>
          <p className="text-sm text-text-tertiary">Company profile and settings</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/settings/company')}>
          Edit Settings
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl">
            🏢
          </div>
          <h2 className="mb-1 text-2xl font-bold text-text-primary">{company?.name}</h2>
          <Badge>{company?.industry || 'General'}</Badge>
          <div className="mt-6 space-y-3 text-sm text-text-secondary">
            <p>Verification Level: {company?.verification_level || 1}</p>
            <p>Language: {company?.language_preference || 'hi-IN'}</p>
            <p>Created: {company?.created_at ? new Date(company.created_at).toLocaleDateString() : '-'}</p>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Company Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-bg-elevated p-4">
              <div>
                <p className="font-medium text-text-primary">Verification Level</p>
                <p className="text-sm text-text-tertiary">
                  {company?.verification_level === 1 ? 'Basic - Name & Phone' :
                   company?.verification_level === 2 ? 'Standard - OTP' :
                   'Strict - Full KYC'}
                </p>
              </div>
              <Badge variant={
                company?.verification_level === 1 ? 'warning' :
                company?.verification_level === 2 ? 'brand' : 'error'
              }>
                Level {company?.verification_level || 1}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-bg-elevated p-4">
              <div>
                <p className="font-medium text-text-primary">Industry</p>
                <p className="text-sm text-text-tertiary capitalize">{company?.industry || 'General'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-bg-elevated p-4">
              <div>
                <p className="font-medium text-text-primary">Business Hours</p>
                <p className="text-sm text-text-tertiary">
                  {company?.business_hours_start || '09:00'} - {company?.business_hours_end || '21:00'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CompanyPage
