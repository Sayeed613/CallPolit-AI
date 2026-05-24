import { create } from 'zustand'
import { companyApi } from '../lib/api'

interface Company {
  id: string
  name: string
  industry: string
  mode: string
  verification_level: number
  language_preference: string[]
  escalation_phone: string
  business_hours_start: string
  business_hours_end: string
  after_hours_message: string
  twilio_phone_number: string
  created_at: string
}

interface CompanyState {
  company: Company | null
  loading: boolean
  initialized: boolean
  error: string | null

  fetchCompany: () => Promise<void>
  updateCompany: (data: Partial<Company>) => Promise<void>
  setCompany: (company: Company) => void
  clearCompany: () => void
}

const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  loading: false,
  initialized: false,
  error: null,

  fetchCompany: async () => {
    set({ loading: true, error: null })
    try {
      const data = await companyApi.get()
      if (data) {
        set({ company: data, initialized: true, loading: false })
      } else {
        set({ initialized: true, loading: false })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch company'
      set({ error: message, initialized: true, loading: false })
    }
  },

  updateCompany: async (data: Partial<Company>) => {
    const current = useCompanyStore.getState().company
    if (!current?.id) return

    set({ loading: true, error: null })
    try {
      await companyApi.update(current.id, data)
      set({ company: { ...current, ...data }, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update company'
      set({ error: message, loading: false })
    }
  },

  setCompany: (company: Company) => set({ company, initialized: true }),
  clearCompany: () => set({ company: null, initialized: false }),
}))

export default useCompanyStore
