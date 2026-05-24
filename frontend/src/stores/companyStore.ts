import { create } from 'zustand'
import { api, type Company } from '../lib/api'

interface CompanyState {
  companies: Company[]
  activeCompany: Company | null
  loading: boolean
  fetchCompanies: () => Promise<void>
  setActiveCompany: (id: string) => void
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  activeCompany: null,
  loading: false,

  fetchCompanies: async () => {
    set({ loading: true })
    try {
      const data = await api.company.list()
      const companies = data.companies
      set({ companies })
      if (!get().activeCompany && companies.length > 0) {
        set({ activeCompany: companies[0] })
      }
    } catch {
      // Silently fail
    } finally {
      set({ loading: false })
    }
  },

  setActiveCompany: (id: string) => {
    const company = get().companies.find((c) => c.id === id) || null
    set({ activeCompany: company })
  },

  updateCompany: async (id, data) => {
    try {
      await api.company.update(id, data)
      const companies = get().companies.map((c) =>
        c.id === id ? { ...c, ...data } : c
      )
      const activeCompany = get().activeCompany?.id === id
        ? { ...get().activeCompany!, ...data }
        : get().activeCompany
      set({ companies, activeCompany })
    } catch {
      // Silently fail
    }
  },
}))
